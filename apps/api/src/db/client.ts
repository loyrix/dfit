import postgres from "postgres";

export type SqlClient = postgres.Sql;

export const createSqlClient = (databaseUrl: string): SqlClient =>
  postgres(databaseUrl, {
    max: 5,
    prepare: false,
    ssl: shouldUseSsl(databaseUrl) ? "require" : false,
    onnotice: () => {},
  });

const shouldUseSsl = (databaseUrl: string): boolean => {
  try {
    const url = new URL(databaseUrl);
    return !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return true;
  }
};
