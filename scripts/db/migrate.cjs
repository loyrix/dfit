#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const postgres = require("postgres");

const repoRoot = path.resolve(__dirname, "../..");
const migrationsDir = path.join(repoRoot, "infra/db/migrations");
const seedersDir = path.join(repoRoot, "infra/db/seeders");

const command = process.argv[2] ?? "status";
const targetArg = process.argv[3];

loadEnvFile(path.join(repoRoot, ".env"));
loadEnvFile(path.join(repoRoot, ".env.local"));

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  fatal("DATABASE_URL is required. Put it in .env or pass it in the deployment environment.");
}

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  ssl: shouldUseSsl(databaseUrl) ? "require" : false,
  onnotice: () => {},
});

main()
  .catch((error) => {
    printConnectionHelp(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });

async function main() {
  switch (command) {
    case "up":
      await ensureMetaTables();
      await migrateUp();
      break;
    case "down":
      await ensureMetaTables();
      await migrateDown(targetArg);
      break;
    case "seed":
      await ensureMetaTables();
      await runSeeders();
      break;
    case "deploy":
      await ensureMetaTables();
      await migrateUp();
      await runSeeders();
      break;
    case "status":
      await ensureMetaTables();
      await printStatus();
      break;
    case "validate":
      validateMigrationPairs();
      console.log("Migration files are valid.");
      break;
    case "new":
      createNewMigration(targetArg);
      break;
    default:
      fatal(
        [
          `Unknown command: ${command}`,
          "Usage:",
          "  node scripts/db/migrate.cjs status",
          "  node scripts/db/migrate.cjs validate",
          "  node scripts/db/migrate.cjs up",
          "  node scripts/db/migrate.cjs down [version|steps]",
          "  node scripts/db/migrate.cjs seed",
          "  node scripts/db/migrate.cjs deploy",
          "  node scripts/db/migrate.cjs new add_user_preferences",
        ].join("\n"),
      );
  }
}

async function ensureMetaTables() {
  await sql`
    create table if not exists schema_migrations (
      version text primary key,
      name text not null,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists schema_seeders (
      version text primary key,
      name text not null,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `;
}

function printConnectionHelp(error) {
  const url = safeDatabaseUrl();
  const isLocal = url && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

  if (
    error &&
    (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.code === "ETIMEDOUT")
  ) {
    console.error(`Database connection failed: ${error.code}`);
    if (url) {
      console.error(`DATABASE_URL points to ${url.hostname}${url.port ? `:${url.port}` : ""}`);
    }
    console.error("");

    if (isLocal) {
      console.error("Your DATABASE_URL is pointing at a local Postgres/Supabase instance.");
      console.error(
        "Either start local Supabase/Postgres, or replace DATABASE_URL with your Supabase Postgres connection string.",
      );
    } else {
      console.error(
        "Check that DATABASE_URL is the Postgres connection string, not the Supabase API URL.",
      );
      console.error(
        "For Supabase, copy it from Project Settings -> Database -> Connection string.",
      );
      console.error(
        "If the direct db.<project-ref>.supabase.co host does not resolve, use the Supabase pooler connection string instead.",
      );
    }

    console.error("");
    console.error("Expected examples:");
    console.error("  Local:    postgres://postgres:postgres@127.0.0.1:54322/postgres");
    console.error(
      "  Supabase: postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres",
    );
    console.error(
      "  Pooler:   postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres",
    );
    return;
  }

  console.error(error);
}

function safeDatabaseUrl() {
  try {
    return new URL(databaseUrl);
  } catch {
    return undefined;
  }
}

async function migrateUp() {
  const migrations = readMigrations();
  const applied = await appliedVersions("schema_migrations");
  const pending = migrations.filter((migration) => !applied.has(migration.version));

  if (pending.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  for (const migration of pending) {
    console.log(`Applying migration ${migration.version} ${migration.name}`);
    const started = Date.now();
    await sql.begin(async (tx) => {
      await tx.unsafe(migration.upSql);
      await tx`
        insert into schema_migrations (version, name, checksum)
        values (${migration.version}, ${migration.name}, ${migration.upChecksum})
      `;
    });
    console.log(`Applied ${migration.version} in ${Date.now() - started}ms`);
  }
}

async function migrateDown(target) {
  const migrations = readMigrations();
  const appliedRows = await sql`
    select version from schema_migrations order by version desc
  `;
  const applied = appliedRows.map((row) => row.version);

  if (applied.length === 0) {
    console.log("No applied migrations to roll back.");
    return;
  }

  const rollbackVersions = resolveRollbackVersions(applied, target);
  if (rollbackVersions.length === 0) {
    console.log("No migrations selected for rollback.");
    return;
  }

  for (const version of rollbackVersions) {
    const migration = migrations.find((item) => item.version === version);
    if (!migration) fatal(`Applied migration ${version} has no local migration file.`);

    console.log(`Rolling back migration ${migration.version} ${migration.name}`);
    const started = Date.now();
    await sql.begin(async (tx) => {
      await tx.unsafe(migration.downSql);
      await tx`
        delete from schema_migrations
        where version = ${migration.version}
      `;
    });
    console.log(`Rolled back ${migration.version} in ${Date.now() - started}ms`);
  }
}

async function runSeeders() {
  const seeders = readSeeders();
  const applied = await appliedVersions("schema_seeders");
  const pending = seeders.filter((seeder) => !applied.has(seeder.version));

  if (pending.length === 0) {
    console.log("No pending seeders.");
    return;
  }

  for (const seeder of pending) {
    console.log(`Applying seeder ${seeder.version} ${seeder.name}`);
    const started = Date.now();
    await sql.begin(async (tx) => {
      await tx.unsafe(seeder.sql);
      await tx`
        insert into schema_seeders (version, name, checksum)
        values (${seeder.version}, ${seeder.name}, ${seeder.checksum})
      `;
    });
    console.log(`Applied seeder ${seeder.version} in ${Date.now() - started}ms`);
  }
}

async function printStatus() {
  const migrations = readMigrations();
  const seeders = readSeeders();
  const appliedMigrations = await appliedVersions("schema_migrations");
  const appliedSeeders = await appliedVersions("schema_seeders");

  console.log("Migrations");
  for (const migration of migrations) {
    console.log(
      `${appliedMigrations.has(migration.version) ? "up  " : "down"} ${migration.version} ${migration.name}`,
    );
  }

  console.log("");
  console.log("Seeders");
  for (const seeder of seeders) {
    console.log(
      `${appliedSeeders.has(seeder.version) ? "done" : "pend"} ${seeder.version} ${seeder.name}`,
    );
  }
}

async function appliedVersions(tableName) {
  const rows = await sql.unsafe(`select version from ${tableName}`);
  return new Set(rows.map((row) => row.version));
}

function resolveRollbackVersions(appliedVersionsDesc, target) {
  if (!target) return [appliedVersionsDesc[0]];

  if (/^\d+$/.test(target)) {
    return appliedVersionsDesc.slice(0, Number(target));
  }

  const targetIndex = appliedVersionsDesc.indexOf(target);
  if (targetIndex === -1) {
    fatal(`Target migration ${target} is not applied.`);
  }

  return appliedVersionsDesc.slice(0, targetIndex + 1);
}

function readMigrations() {
  validateMigrationPairs();

  const files = fs.readdirSync(migrationsDir);
  const upFiles = files.filter((file) => file.endsWith(".up.sql")).sort();

  return upFiles.map((upFile) => {
    const match = upFile.match(/^(\d{14})_(.+)\.up\.sql$/);
    if (!match) fatal(`Invalid migration filename: ${upFile}`);

    const [, version, name] = match;
    const downFile = `${version}_${name}.down.sql`;
    const upPath = path.join(migrationsDir, upFile);
    const downPath = path.join(migrationsDir, downFile);
    const upSql = fs.readFileSync(upPath, "utf8");
    const downSql = fs.readFileSync(downPath, "utf8");

    return {
      version,
      name,
      upFile,
      downFile,
      upSql,
      downSql,
      upChecksum: checksum(upSql),
      downChecksum: checksum(downSql),
    };
  });
}

function readSeeders() {
  if (!fs.existsSync(seedersDir)) return [];

  return fs
    .readdirSync(seedersDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => {
      const match = file.match(/^(\d{14})_(.+)\.sql$/);
      if (!match) {
        fatal(`Invalid seeder filename: ${file}. Use YYYYMMDDHHMMSS_name.sql.`);
      }

      const [, version, name] = match;
      const sqlText = fs.readFileSync(path.join(seedersDir, file), "utf8");
      return {
        version,
        name,
        file,
        sql: sqlText,
        checksum: checksum(sqlText),
      };
    });
}

function validateMigrationPairs() {
  if (!fs.existsSync(migrationsDir)) {
    fatal(`Missing migrations directory: ${migrationsDir}`);
  }

  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql"));
  const upFiles = files.filter((file) => file.endsWith(".up.sql"));
  const downFiles = files.filter((file) => file.endsWith(".down.sql"));

  for (const file of files) {
    if (!/^\d{14}_[a-z0-9_]+\.(up|down)\.sql$/.test(file)) {
      fatal(
        `Invalid migration filename: ${file}. Use YYYYMMDDHHMMSS_name.up.sql and YYYYMMDDHHMMSS_name.down.sql.`,
      );
    }
  }

  for (const upFile of upFiles) {
    const downFile = upFile.replace(".up.sql", ".down.sql");
    if (!downFiles.includes(downFile)) {
      fatal(`Missing down migration for ${upFile}`);
    }
  }

  for (const downFile of downFiles) {
    const upFile = downFile.replace(".down.sql", ".up.sql");
    if (!upFiles.includes(upFile)) {
      fatal(`Missing up migration for ${downFile}`);
    }
  }
}

function createNewMigration(rawName) {
  if (!rawName) {
    fatal("Migration name is required. Example: pnpm db:new add_user_preferences");
  }

  const name = slugifyName(rawName);
  if (!name) fatal(`Invalid migration name: ${rawName}`);

  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const timestamp = timestampWithSeconds(new Date());
  const upFile = `${timestamp}_${name}.up.sql`;
  const downFile = `${timestamp}_${name}.down.sql`;
  const upPath = path.join(migrationsDir, upFile);
  const downPath = path.join(migrationsDir, downFile);

  fs.writeFileSync(upPath, `-- ${timestamp}_${name}.up.sql\n\n`, { flag: "wx" });
  fs.writeFileSync(downPath, `-- ${timestamp}_${name}.down.sql\n\n`, { flag: "wx" });

  console.log(`Created ${path.relative(repoRoot, upPath)}`);
  console.log(`Created ${path.relative(repoRoot, downPath)}`);
}

function slugifyName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function timestampWithSeconds(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function checksum(text) {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed
      .slice(equalsIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function shouldUseSsl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return true;
  }
}

function fatal(message) {
  console.error(message);
  process.exit(1);
}
