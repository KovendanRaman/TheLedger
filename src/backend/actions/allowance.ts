"use server";

import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/backend/lib/db";
import { users, incomes, recurringExpenses } from "@/backend/lib/db/schema";
import { auth } from "@/backend/lib/auth";
import type { AppMode, Income, RecurringExpense } from "@/backend/lib/types/database.types";

// ─── Helpers ──────────────────────────────────────────────────

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user.id;
}

function clampResetDay(day: number): number {
  return Math.max(1, Math.min(28, Math.round(day)));
}

// ─── App Mode ─────────────────────────────────────────────────

export async function updateAppMode(
  mode: AppMode
): Promise<{ error?: string }> {
  try {
    const userId = await getAuthUserId();
    await db.update(users).set({ appMode: mode }).where(eq(users.id, userId));
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update mode." };
  }
}

export async function updateAllowanceResetDay(
  day: number
): Promise<{ error?: string }> {
  try {
    const userId = await getAuthUserId();
    await db
      .update(users)
      .set({ allowanceResetDay: clampResetDay(day) })
      .where(eq(users.id, userId));
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update reset day." };
  }
}

// ─── Income Sources ───────────────────────────────────────────

export async function getIncomes(): Promise<Income[]> {
  const userId = await getAuthUserId();
  const rows = await db
    .select()
    .from(incomes)
    .where(eq(incomes.userId, userId))
    .orderBy(desc(incomes.createdAt));

  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    amount: Number(r.amount),
    source: r.source,
    is_recurring: r.isRecurring,
    date: r.date,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function addIncome(formData: FormData): Promise<{ error?: string }> {
  try {
    const userId = await getAuthUserId();
    const amount = parseFloat(formData.get("amount") as string);
    const source = (formData.get("source") as string).trim();
    const isRecurring = formData.get("is_recurring") === "true";
    const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];

    if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount.");
    if (!source) throw new Error("Source is required.");

    await db.insert(incomes).values({ userId, amount: String(amount), source, isRecurring, date });
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add income." };
  }
}

export async function updateIncome(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const userId = await getAuthUserId();
    const amount = parseFloat(formData.get("amount") as string);
    const source = (formData.get("source") as string).trim();
    const isRecurring = formData.get("is_recurring") === "true";
    const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];

    if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount.");
    if (!source) throw new Error("Source is required.");

    const updated = await db
      .update(incomes)
      .set({ amount: String(amount), source, isRecurring, date })
      .where(and(eq(incomes.id, id), eq(incomes.userId, userId)))
      .returning({ id: incomes.id });

    if (!updated[0]) throw new Error("Income not found or not authorised.");
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update income." };
  }
}

export async function deleteIncome(id: string): Promise<{ error?: string }> {
  try {
    const userId = await getAuthUserId();
    const deleted = await db
      .delete(incomes)
      .where(and(eq(incomes.id, id), eq(incomes.userId, userId)))
      .returning({ id: incomes.id });

    if (!deleted[0]) throw new Error("Income not found or not authorised.");
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete income." };
  }
}

// ─── Recurring Expenses (Debit Orders) ───────────────────────

export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  const userId = await getAuthUserId();
  const rows = await db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.userId, userId))
    .orderBy(recurringExpenses.billingDate);

  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    name: r.name,
    amount: Number(r.amount),
    billing_date: r.billingDate,
    is_active: r.isActive,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function addRecurringExpense(
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const userId = await getAuthUserId();
    const amount = parseFloat(formData.get("amount") as string);
    const name = (formData.get("name") as string).trim();
    const billingDate = clampResetDay(parseInt(formData.get("billing_date") as string, 10));
    const isActive = formData.get("is_active") !== "false";

    if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount.");
    if (!name) throw new Error("Name is required.");

    await db
      .insert(recurringExpenses)
      .values({ userId, name, amount: String(amount), billingDate, isActive });
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add debit order." };
  }
}

export async function updateRecurringExpense(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const userId = await getAuthUserId();
    const amount = parseFloat(formData.get("amount") as string);
    const name = (formData.get("name") as string).trim();
    const billingDate = clampResetDay(parseInt(formData.get("billing_date") as string, 10));
    const isActive = formData.get("is_active") !== "false";

    if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount.");
    if (!name) throw new Error("Name is required.");

    const updated = await db
      .update(recurringExpenses)
      .set({ name, amount: String(amount), billingDate, isActive })
      .where(
        and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId))
      )
      .returning({ id: recurringExpenses.id });

    if (!updated[0]) throw new Error("Debit order not found or not authorised.");
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update debit order." };
  }
}

export async function deleteRecurringExpense(
  id: string
): Promise<{ error?: string }> {
  try {
    const userId = await getAuthUserId();
    const deleted = await db
      .delete(recurringExpenses)
      .where(
        and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId))
      )
      .returning({ id: recurringExpenses.id });

    if (!deleted[0]) throw new Error("Debit order not found or not authorised.");
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete debit order." };
  }
}

export async function toggleRecurringExpense(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  try {
    const userId = await getAuthUserId();
    await db
      .update(recurringExpenses)
      .set({ isActive })
      .where(
        and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId))
      );
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to toggle debit order." };
  }
}
