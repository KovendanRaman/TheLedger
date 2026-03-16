"use server";

import { eq, or, isNull, desc } from "drizzle-orm";
import { db } from "@/backend/lib/db";
import {
  transactions,
  categories,
  invoices,
  users,
  parentalLinks,
} from "@/backend/lib/db/schema";
import { auth } from "@/backend/lib/auth";
import type {
  Transaction,
  Category,
  Invoice,
  UserProfile,
  ParentalLink,
} from "@/backend/lib/types/database.types";

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
  };
}

// ─── Dashboard data (server component use) ───────────────────

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
