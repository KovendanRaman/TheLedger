"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/backend/lib/db";
import { users } from "@/backend/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function registerUser(
  fullName: string,
  email: string,
  password: string
): Promise<{ error: string | null }> {
  if (!fullName.trim() || !email.trim() || password.length < 8) {
    return { error: "Please fill in all fields. Password must be at least 8 characters." };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (existing.length > 0) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email: email.toLowerCase().trim(),
    passwordHash,
    fullName: fullName.trim(),
  });

  return { error: null };
}

export async function updateSharingEnabled(
  userId: string,
  enabled: boolean
): Promise<{ error: string | null }> {
  try {
    await db
      .update(users)
      .set({ isSharingEnabled: enabled })
      .where(eq(users.id, userId));
    revalidatePath("/settings");
    return { error: null };
  } catch {
    return { error: "Could not update sharing settings." };
  }
}
