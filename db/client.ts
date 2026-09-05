import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema.js";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:db.sqlite";
export const dbConn = createClient({
  url: databaseUrl,
});

export const dbClient = drizzle(dbConn, {
  schema: schema,
  logger: true,
});
