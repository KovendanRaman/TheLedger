import type { ReactNode } from "react";
import "@/frontend/styles/globals.css";

// Bare layout — no sidebar, no nav, no footer — for clean print/PDF pages
export default function PrintLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
