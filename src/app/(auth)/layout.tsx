import React from "react";

// Force dynamic rendering for all auth routes — session checks require runtime cookies.
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
