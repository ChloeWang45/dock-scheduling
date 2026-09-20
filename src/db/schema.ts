import { pgTable, pgEnum, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "staff", "viewer"]);
export const userStatus = pgEnum("user_status", ["pending", "approved"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("viewer"),
  status: userStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
