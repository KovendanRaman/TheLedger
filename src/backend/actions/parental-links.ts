"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/backend/lib/db";
import { parentalLinks } from "@/backend/lib/db/schema";
import { auth } from "@/backend/lib/auth";
import type { ParentalLink } from "@/backend/lib/types/database.types";

async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getParentalLinks(): Promise<ParentalLink[]> {
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

export async function createParentalLink(
  label: string
): Promise<{ link: ParentalLink | null; error: string | null }> {
  const trimmed = label.trim();
  if (!trimmed) return { link: null, error: "Label cannot be empty." };
  if (trimmed.length > 40) return { link: null, error: "Label is too long (max 40 chars)." };

  const userId = await getAuthUserId();
  if (!userId) return { link: null, error: "Not authenticated." };

  const existing = await db
    .select({ id: parentalLinks.id })
    .from(parentalLinks)
    .where(eq(parentalLinks.userId, userId));

  if (existing.length >= 10) {
    return { link: null, error: "Maximum of 10 share links allowed." };
  }

  const [row] = await db
    .insert(parentalLinks)
    .values({ userId, label: trimmed })
    .returning();

  revalidatePath("/settings");
  return {
    link: { id: row.id, user_id: row.userId, key: row.key, label: row.label, created_at: row.createdAt.toISOString() },
    error: null,
  };
}

export async function deleteParentalLink(
  id: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated." };

  await db
    .delete(parentalLinks)
    .where(and(eq(parentalLinks.id, id), eq(parentalLinks.userId, userId)));

  revalidatePath("/settings");
  return { error: null };
}

export async function updateParentalLinkLabel(
  id: string,
  label: string
): Promise<{ error: string | null }> {
  const trimmed = label.trim();
  if (!trimmed) return { error: "Label cannot be empty." };

  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated." };

  await db
    .update(parentalLinks)
    .set({ label: trimmed })
    .where(and(eq(parentalLinks.id, id), eq(parentalLinks.userId, userId)));

  revalidatePath("/settings");
  return { error: null };
}
