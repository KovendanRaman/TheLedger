// ─── Enums ────────────────────────────────────────────────────
export type TransactionStatus = "pending" | "invoiced" | "paid";
export type InvoiceStatus = "open" | "paid";

// ─── Domain types (used throughout the app) ───────────────────
// These mirror the Drizzle schema but with JS-friendly types
// (numbers instead of numeric strings, etc.)

export type Theme = "light" | "dark";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  is_sharing_enabled: boolean;
  theme: Theme;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  color: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  month_label: string;
  total_amount: number;
  status: InvoiceStatus;
  generated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id: string | null;
  is_invoicable: boolean;
  status: TransactionStatus;
  invoice_id: string | null;
  date: string;
  created_at: string;
  // Joined fields
  categories?: Pick<Category, "name" | "color"> | null;
}

export interface ParentalLink {
  id: string;
  user_id: string;
  key: string;
  label: string;
  created_at: string;
}

export interface ParentalViewRow {
  id: string;
  amount: number;
  description: string;
  category_name: string | null;
  category_color: string | null;
  status: TransactionStatus;
  date: string;
  invoice_id: string | null;
  month_label: string | null;
}
