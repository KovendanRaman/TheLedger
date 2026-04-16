"use server";

import { eq, and, or, isNull, desc, gte, lte, sum } from "drizzle-orm";
import { db } from "@/backend/lib/db";
import {
  transactions,
  categories,
  invoices,
  users,
  parentalLinks,
  incomes,
  recurringExpenses,
} from "@/backend/lib/db/schema";
import { auth } from "@/backend/lib/auth";
import type {
  Transaction,
  Category,
  Invoice,
  UserProfile,
  ParentalLink,
  AllowanceDashboardData,
} from "@/backend/lib/types/database.types";
import { getBillingCycle } from "@/backend/lib/dates";

// ─── Helpers ──────────────────────────────────────────────────

async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// ─── Transactions ─────────────────────────────────────────────

export async function getUserTransactions(): Promise<Transaction[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];

  const rows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      amount: transactions.amount,
      description: transactions.description,
      categoryId: transactions.categoryId,
      isInvoicable: transactions.isInvoicable,
      status: transactions.status,
      invoiceId: transactions.invoiceId,
      date: transactions.date,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt));

  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    amount: Number(r.amount),
    description: r.description,
    category_id: r.categoryId,
    is_invoicable: r.isInvoicable,
    status: r.status,
    invoice_id: r.invoiceId,
    date: r.date,
    created_at: r.createdAt.toISOString(),
    categories: r.categoryName
      ? { name: r.categoryName, color: r.categoryColor! }
      : null,
  }));
}

// ─── Invoices ─────────────────────────────────────────────────

export async function getInvoicesData(): Promise<{
  invoices: Invoice[];
  txnCounts: Record<string, number>;
  hasPendingInvoicable: boolean;
}> {
  const userId = await getAuthUserId();
  if (!userId) return { invoices: [], txnCounts: {}, hasPendingInvoicable: false };

  const [invRows, txnRows] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.generatedAt)),
    db
      .select({
        id: transactions.id,
        invoiceId: transactions.invoiceId,
        isInvoicable: transactions.isInvoicable,
        status: transactions.status,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId)),
  ]);

  const counts: Record<string, number> = {};
  let hasPendingInvoicable = false;

  for (const t of txnRows) {
    if (t.invoiceId) {
      counts[t.invoiceId] = (counts[t.invoiceId] ?? 0) + 1;
    }
    if (t.isInvoicable && t.status === "pending") {
      hasPendingInvoicable = true;
    }
  }

  return {
    invoices: invRows.map((i) => ({
      id: i.id,
      user_id: i.userId,
      month_label: i.monthLabel,
      total_amount: Number(i.totalAmount),
      status: i.status,
      generated_at: i.generatedAt.toISOString(),
    })),
    txnCounts: counts,
    hasPendingInvoicable,
  };
}

// ─── Pending invoicable transactions ──────────────────────────

export async function getPendingInvoicableTransactions(): Promise<Transaction[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];

  const rows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      amount: transactions.amount,
      description: transactions.description,
      categoryId: transactions.categoryId,
      isInvoicable: transactions.isInvoicable,
      status: transactions.status,
      invoiceId: transactions.invoiceId,
      date: transactions.date,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.isInvoicable, true),
        eq(transactions.status, "pending")
      )
    )
    .orderBy(desc(transactions.createdAt));

  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    amount: Number(r.amount),
    description: r.description,
    category_id: r.categoryId,
    is_invoicable: r.isInvoicable,
    status: r.status,
    invoice_id: r.invoiceId,
    date: r.date,
    created_at: r.createdAt.toISOString(),
    categories: r.categoryName
      ? { name: r.categoryName, color: r.categoryColor! }
      : null,
  }));
}

// ─── Single transaction ────────────────────────────────────────

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const rows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      amount: transactions.amount,
      description: transactions.description,
      categoryId: transactions.categoryId,
      isInvoicable: transactions.isInvoicable,
      status: transactions.status,
      invoiceId: transactions.invoiceId,
      date: transactions.date,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1);

  const r = rows[0];
  if (!r) return null;

  return {
    id: r.id,
    user_id: r.userId,
    amount: Number(r.amount),
    description: r.description,
    category_id: r.categoryId,
    is_invoicable: r.isInvoicable,
    status: r.status,
    invoice_id: r.invoiceId,
    date: r.date,
    created_at: r.createdAt.toISOString(),
    categories: r.categoryName
      ? { name: r.categoryName, color: r.categoryColor! }
      : null,
  };
}

// ─── Categories ───────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const userId = await getAuthUserId();

  const rows = await db
    .select()
    .from(categories)
    .where(or(isNull(categories.userId), eq(categories.userId, userId ?? "")))
    .orderBy(categories.name);

  return rows.map((c) => ({
    id: c.id,
    user_id: c.userId,
    name: c.name,
    color: c.color,
    created_at: c.createdAt.toISOString(),
  }));
}

// ─── User profile ─────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      isSharingEnabled: users.isSharingEnabled,
      theme: users.theme,
      appMode: users.appMode,
      allowanceResetDay: users.allowanceResetDay,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const u = result[0];
  if (!u) return null;

  return {
    id: u.id,
    email: u.email,
    full_name: u.fullName,
    is_sharing_enabled: u.isSharingEnabled,
    theme: (u.theme === "dark" ? "dark" : "light") as "light" | "dark",
    appMode: u.appMode,
    allowanceResetDay: u.allowanceResetDay,
  };
}

// ─── Dashboard data (server component use) ───────────────────────

export async function getDashboardData(userId: string) {
  const rows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      amount: transactions.amount,
      description: transactions.description,
      categoryId: transactions.categoryId,
      isInvoicable: transactions.isInvoicable,
      status: transactions.status,
      invoiceId: transactions.invoiceId,
      date: transactions.date,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(30);

  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    amount: Number(r.amount),
    description: r.description,
    category_id: r.categoryId,
    is_invoicable: r.isInvoicable,
    status: r.status,
    invoice_id: r.invoiceId,
    date: r.date,
    created_at: r.createdAt.toISOString(),
    categories: r.categoryName
      ? { name: r.categoryName, color: r.categoryColor! }
      : null,
  }));
}

// ─── Allowance Dashboard data ─────────────────────────────────

export async function getAllowanceDashboardData(
  userId: string
): Promise<AllowanceDashboardData> {
  // Fetch the user's reset day
  const [userRow] = await db
    .select({ allowanceResetDay: users.allowanceResetDay })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const resetDay = userRow?.allowanceResetDay ?? 1;
  const { startDate, endDate } = getBillingCycle(new Date(), resetDay);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const [incomeRows, recurringRows, txnRows] = await Promise.all([
    // Income within the billing cycle
    db
      .select()
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, userId),
          gte(incomes.date, startStr),
          lte(incomes.date, endStr)
        )
      ),
    // Active recurring expenses (debit orders)
    db
      .select()
      .from(recurringExpenses)
      .where(
        and(
          eq(recurringExpenses.userId, userId),
          eq(recurringExpenses.isActive, true)
        )
      ),
    // Transactions (variable spend) within the billing cycle
    db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        amount: transactions.amount,
        description: transactions.description,
        categoryId: transactions.categoryId,
        isInvoicable: transactions.isInvoicable,
        status: transactions.status,
        invoiceId: transactions.invoiceId,
        date: transactions.date,
        createdAt: transactions.createdAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startStr),
          lte(transactions.date, endStr)
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(50),
  ]);

  const baseline = incomeRows.reduce((s, r) => s + Number(r.amount), 0);
  const obligations = recurringRows.reduce((s, r) => s + Number(r.amount), 0);
  const variableSpend = txnRows.reduce((s, r) => s + Number(r.amount), 0);
  const safeToSpend = baseline - obligations - variableSpend;

  const mappedTxns: Transaction[] = txnRows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    amount: Number(r.amount),
    description: r.description,
    category_id: r.categoryId,
    is_invoicable: r.isInvoicable,
    status: r.status,
    invoice_id: r.invoiceId,
    date: r.date,
    created_at: r.createdAt.toISOString(),
    categories: r.categoryName
      ? { name: r.categoryName, color: r.categoryColor! }
      : null,
  }));

  const mappedRecurring = recurringRows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    name: r.name,
    amount: Number(r.amount),
    billing_date: r.billingDate,
    is_active: r.isActive,
    created_at: r.createdAt.toISOString(),
  }));

  return {
    safeToSpend,
    baseline,
    obligations,
    variableSpend,
    cycleStart: startStr,
    cycleEnd: endStr,
    recentTxns: mappedTxns,
    recurringExpenses: mappedRecurring,
  };
}

// ─── Invoice with transactions (for PDF print view) ──────────

export async function getInvoiceWithTransactions(invoiceId: string): Promise<{
  invoice: Invoice;
  txns: Transaction[];
  profile: UserProfile | null;
} | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const [invRows, txnRows, profileRows] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
      .limit(1),
    db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        amount: transactions.amount,
        description: transactions.description,
        categoryId: transactions.categoryId,
        isInvoicable: transactions.isInvoicable,
        status: transactions.status,
        invoiceId: transactions.invoiceId,
        date: transactions.date,
        createdAt: transactions.createdAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.invoiceId, invoiceId))
      .orderBy(transactions.date),
    db
      .select({ 
        id: users.id, 
        email: users.email, 
        fullName: users.fullName, 
        isSharingEnabled: users.isSharingEnabled,
        appMode: users.appMode,
        allowanceResetDay: users.allowanceResetDay,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);

  const inv = invRows[0];
  if (!inv) return null;

  return {
    invoice: {
      id: inv.id,
      user_id: inv.userId,
      month_label: inv.monthLabel,
      total_amount: Number(inv.totalAmount),
      status: inv.status,
      generated_at: inv.generatedAt.toISOString(),
    },
    txns: txnRows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      amount: Number(r.amount),
      description: r.description,
      category_id: r.categoryId,
      is_invoicable: r.isInvoicable,
      status: r.status,
      invoice_id: r.invoiceId,
      date: r.date,
      created_at: r.createdAt.toISOString(),
      categories: r.categoryName ? { name: r.categoryName, color: r.categoryColor! } : null,
    })),
    profile: profileRows[0]
      ? {
          id: profileRows[0].id,
          email: profileRows[0].email,
          full_name: profileRows[0].fullName,
          is_sharing_enabled: profileRows[0].isSharingEnabled,
          theme: "light" as const,
          appMode: profileRows[0].appMode,
          allowanceResetDay: profileRows[0].allowanceResetDay,
        }
      : null,
  };
}

// ─── Parental links ───────────────────────────────────────────

export async function getParentalLinksForUser(): Promise<ParentalLink[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];

  const rows = await db
    .select()
    .from(parentalLinks)
    .where(eq(parentalLinks.userId, userId))
    .orderBy(parentalLinks.createdAt);

  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    key: r.key,
    label: r.label,
    created_at: r.createdAt.toISOString(),
  }));
}

// ─── Analytics Helpers ────────────────────────────────────────

export async function getUserIncomes() {
  const userId = await getAuthUserId();
  if (!userId) return [];

  const { incomes } = await import("@/backend/lib/db/schema");
  const rows = await db
    .select()
    .from(incomes)
    .where(eq(incomes.userId, userId))
    .orderBy(incomes.date);

  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    source: r.source,
    date: r.date,
    is_recurring: r.isRecurring,
  }));
}
