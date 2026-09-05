import {
  text,
  integer,
  sqliteTable,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { relations } from "drizzle-orm";

export const usersTable = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name"),
  email: text("email").unique().notNull(),
  password: text("password"), // I remove not null options.
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  avatarURL: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$default(
    () => new Date(),
  ),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  accounts: many(accountsTable),
}));

export type ProviderType = "GITHUB" | "DISCORD" | "GOOGLE";

export const accountsTable = sqliteTable(
  "accounts",
  {
    id: text("id")
      .$defaultFn(() => nanoid())
      .notNull()
      .unique(),
    userId: text("user_id").notNull(),
    provider: text("provider", {
      enum: ["GITHUB", "DISCORD", "GOOGLE"],
    }).notNull(),
    providerAccountId: text("provider_account").notNull(),
    profile: text("profile", { mode: "json" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
  },
  // I add composite key so that each user can have only one provider type.
  (table) => {
    return {
      id: primaryKey({ columns: [table.userId, table.provider] }),
    };
  },
);

export const accountsRelations = relations(accountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
}));

export const sessionsTable = sqliteTable("sessions", {
  sid: text("sid").primaryKey(),
  expired: integer("expired"),
  sess: text("sess", { mode: "json" }),
});

// For constructing user-data object to pass around
type UTI = typeof usersTable.$inferInsert;
type ATI = typeof accountsTable.$inferInsert;
export type UserData = UTI & ATI;
