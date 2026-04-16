import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  numeric,
  integer,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "invoiced",
  "paid",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", ["open", "paid"]);

export const appModeEnum = pgEnum("app_mode", ["INVOICE", "ALLOWANCE"]);

// ─── Users (auth + profile combined) ─────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  isSharingEnabled: boolean("is_sharing_enabled").notNull().default(true),
  theme: text("theme").notNull().default("light"),
  appMode: appModeEnum("app_mode").notNull().default("INVOICE"),
  allowanceResetDay: integer("allowance_reset_day").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Categories ───────────────────────────────────────────────
// user_id = null means it's a global/default category
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Invoices ─────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  monthLabel: text("month_label").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  status: invoiceStatusEnum("status").notNull().default("open"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

// ─── Transactions ─────────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  isInvoicable: boolean("is_invoicable").notNull().default(false),
  status: transactionStatusEnum("status").notNull().default("pending"),
  invoiceId: uuid("invoice_id").references(() => invoices.id, {
    onDelete: "set null",
  }),
  date: date("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Parental Links ───────────────────────────────────────────
export const parentalLinks = pgTable("parental_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  key: uuid("key").notNull().unique().defaultRandom(),
  label: text("label").notNull().default("Parent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Incomes ──────────────────────────────────────────────────
export const incomes = pgTable("incomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  source: text("source").notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  date: date("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Recurring Expenses (Debit Orders) ───────────────────────
export const recurringExpenses = pgTable("recurring_expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  billingDate: integer("billing_date").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Type helpers ─────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ParentalLink = typeof parentalLinks.$inferSelect;
export type Income = typeof incomes.$inferSelect;
export type RecurringExpense = typeof recurringExpenses.$inferSelect;
