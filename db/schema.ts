import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { relations, sql } from "drizzle-orm";
import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const usersTable = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name"),
  email: text("email").unique().notNull(),
  password: text("password"), // I remove not null options.
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  currentChallenge: text("current_challenge"),
  avatarURL: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$default(
    () => new Date(),
  ),
});

export const credentialsTable = sqliteTable("credentials", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  publicKey: blob("public_key").$type<Uint8Array>().notNull(),
  counter: integer("counter").notNull(),
  transports: text("transport", { mode: "json" })
    .notNull()
    .$type<AuthenticatorTransportFuture[]>()
    .default(sql`(json_array())`),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  // accounts: many(accountsTable),
  credentials: many(credentialsTable),
}));

export const credentialsRelations = relations(credentialsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [credentialsTable.userId],
    references: [usersTable.id],
  }),
}));

// For constructing user-data object to pass around
type UTI = typeof usersTable.$inferInsert;
type CTI = typeof credentialsTable.$inferInsert;
export type UserData = UTI & CTI;
