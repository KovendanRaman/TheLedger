import React from "react";

// Force dynamic rendering for all auth routes — Supabase SSR relies on
// runtime cookies and cannot be statically prerendered.
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
