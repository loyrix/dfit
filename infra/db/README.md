# DFit Database Migrations

Migrations are repo-level and deployment-owned.

## Naming

Migration files must use timestamp-with-seconds names:

```txt
YYYYMMDDHHMMSS_descriptive_name.up.sql
YYYYMMDDHHMMSS_descriptive_name.down.sql
```

Example:

```txt
20260511140100_initial_schema.up.sql
20260511140100_initial_schema.down.sql
```

Seeder files use the same timestamp prefix:

```txt
YYYYMMDDHHMMSS_descriptive_name.sql
```

## Commands

Create a migration pair:

```sh
pnpm db:new add_user_preferences
```

Validate migration pairs:

```sh
pnpm db:validate
```

Apply pending migrations:

```sh
pnpm db:migrate
```

Run pending migrations and pending seeders for deployment:

```sh
pnpm db:deploy
```

Rollback the last migration:

```sh
pnpm db:down
```

Rollback the last two migrations:

```sh
pnpm db:down 2
```

Rollback through a specific timestamp:

```sh
pnpm db:down 20260511140100
```

## Tracking Tables

The runner creates:

```txt
schema_migrations
schema_seeders
```

Seeders are tracked separately from migrations so deployment can safely run `db:deploy`
without replaying old seed files.
