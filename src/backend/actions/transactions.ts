"use server";

import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/backend/lib/db";
import { transactions, invoices } from "@/backend/lib/db/schema";
import { auth } from "@/backend/lib/auth";
import { getMonthLabel } from "@/backend/lib/utils";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user.id;
}

// ─── Add transaction ──────────────────────────────────────────
export async function addTransaction(formData: FormData) {
  const userId = await getAuthUserId();

  const amount = parseFloat(formData.get("amount") as string);
  const description = (formData.get("description") as string).trim();
  const categoryId = (formData.get("category_id") as string) || null;
  const isInvoicable = formData.get("is_invoicable") === "true";
  const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];

  if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount.");
  if (!description) throw new Error("Description is required.");

  await db.insert(transactions).values({
    userId,
    amount: String(amount),
    description,
    categoryId,
    isInvoicable,
    date,
    status: "pending",
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}

// ─── Generate invoice from selected transactions ─────────────
export async function generateInvoice(transactionIds?: string[]): Promise<string> {
  const userId = await getAuthUserId();

  const pendingTxns = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.isInvoicable, true),
        eq(transactions.status, "pending")
      )
    );

  if (pendingTxns.length === 0) {
    throw new Error("No pending billable transactions to invoice.");
  }

  const selected = transactionIds?.length
    ? pendingTxns.filter((t) => transactionIds.includes(t.id))
    : pendingTxns;

  if (selected.length === 0) {
    throw new Error("None of the selected transactions are eligible.");
  }

  const total = selected.reduce((s, t) => s + Number(t.amount), 0);

  const [invoice] = await db
    .insert(invoices)
    .values({
      userId,
      monthLabel: getMonthLabel(),
      totalAmount: String(total),
      status: "open",
    })
    .returning();

  try {
    await db
      .update(transactions)
      .set({ status: "invoiced", invoiceId: invoice.id })
      .where(
        inArray(
          transactions.id,
          selected.map((t) => t.id)
        )
      );
  } catch {
    await db.delete(invoices).where(eq(invoices.id, invoice.id));
    throw new Error("Failed to generate invoice. Please try again.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/expenses");

  return invoice.id;
}

// ─── Mark invoice paid ────────────────────────────────────────
export async function markInvoicePaid(invoiceId: string) {
  const userId = await getAuthUserId();

  await db
    .update(invoices)
    .set({ status: "paid" })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)));

  await db
    .update(transactions)
    .set({ status: "paid" })
    .where(eq(transactions.invoiceId, invoiceId));

  revalidatePath("/dashboard");
  revalidatePath("/invoices");
}
