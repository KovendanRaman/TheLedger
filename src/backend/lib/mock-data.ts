import type {
  Transaction,
  Invoice,
  Category,
  UserProfile,
  ParentalLink,
  ParentalViewRow,
} from "@/backend/lib/types/database.types";

export const IS_MOCK_MODE =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// ─── Mock Profile ─────────────────────────────────────────────
export const MOCK_PROFILE: UserProfile = {
  id: "mock-user-001",
  email: "thabo@myuniversity.ac.za",
  full_name: "Thabo Dlamini",
  is_sharing_enabled: true,
  theme: "light",
  appMode: "INVOICE",
  allowanceResetDay: 1,
};

// ─── Mock Categories ─────────────────────────────────────────
export const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", user_id: null, name: "Fuel",          color: "#f59e0b", created_at: "" },
  { id: "cat-2", user_id: null, name: "Groceries",     color: "#10b981", created_at: "" },
  { id: "cat-3", user_id: null, name: "Fast Food",     color: "#ef4444", created_at: "" },
  { id: "cat-4", user_id: null, name: "Transport",     color: "#3b82f6", created_at: "" },
  { id: "cat-5", user_id: null, name: "Stationery",    color: "#8b5cf6", created_at: "" },
  { id: "cat-6", user_id: null, name: "Clothing",      color: "#ec4899", created_at: "" },
  { id: "cat-7", user_id: null, name: "Accommodation", color: "#14b8a6", created_at: "" },
  { id: "cat-8", user_id: null, name: "Entertainment", color: "#f97316", created_at: "" },
  { id: "cat-9", user_id: null, name: "Other",         color: "#6b7280", created_at: "" },
];

// ─── Mock Invoice ─────────────────────────────────────────────
export const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-001",
    user_id: "mock-user-001",
    month_label: "March 2026",
    total_amount: 1_450.00,
    status: "open",
    generated_at: "2026-03-10T09:00:00Z",
  },
  {
    id: "inv-002",
    user_id: "mock-user-001",
    month_label: "February 2026",
    total_amount: 2_120.50,
    status: "paid",
    generated_at: "2026-02-28T14:30:00Z",
  },
];

// ─── Mock Transactions ────────────────────────────────────────
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "txn-001",
    user_id: "mock-user-001",
    amount: 580.00,
    description: "Checkers groceries",
    category_id: "cat-2",
    is_invoicable: true,
    status: "invoiced",
    invoice_id: "inv-001",
    date: "2026-03-08",
    created_at: "2026-03-08T11:00:00Z",
    categories: { name: "Groceries", color: "#10b981" },
  },
  {
    id: "txn-002",
    user_id: "mock-user-001",
    amount: 320.00,
    description: "Uber ride to campus",
    category_id: "cat-4",
    is_invoicable: true,
    status: "invoiced",
    invoice_id: "inv-001",
    date: "2026-03-07",
    created_at: "2026-03-07T08:30:00Z",
    categories: { name: "Transport", color: "#3b82f6" },
  },
  {
    id: "txn-003",
    user_id: "mock-user-001",
    amount: 550.00,
    description: "Textbooks & stationery",
    category_id: "cat-5",
    is_invoicable: true,
    status: "invoiced",
    invoice_id: "inv-001",
    date: "2026-03-05",
    created_at: "2026-03-05T10:00:00Z",
    categories: { name: "Stationery", color: "#8b5cf6" },
  },
  {
    id: "txn-004",
    user_id: "mock-user-001",
    amount: 89.90,
    description: "Uber Eats — McDonald's",
    category_id: "cat-3",
    is_invoicable: false,
    status: "pending",
    invoice_id: null,
    date: "2026-03-10",
    created_at: "2026-03-10T19:45:00Z",
    categories: { name: "Fast Food", color: "#ef4444" },
  },
  {
    id: "txn-005",
    user_id: "mock-user-001",
    amount: 450.00,
    description: "Res accommodation top-up",
    category_id: "cat-7",
    is_invoicable: true,
    status: "pending",
    invoice_id: null,
    date: "2026-03-09",
    created_at: "2026-03-09T07:00:00Z",
    categories: { name: "Accommodation", color: "#14b8a6" },
  },
  {
    id: "txn-006",
    user_id: "mock-user-001",
    amount: 200.00,
    description: "Engen fuel",
    category_id: "cat-1",
    is_invoicable: true,
    status: "pending",
    invoice_id: null,
    date: "2026-03-09",
    created_at: "2026-03-09T16:20:00Z",
    categories: { name: "Fuel", color: "#f59e0b" },
  },
  {
    id: "txn-007",
    user_id: "mock-user-001",
    amount: 65.00,
    description: "Vida e Caffè coffee",
    category_id: "cat-8",
    is_invoicable: false,
    status: "pending",
    invoice_id: null,
    date: "2026-03-11",
    created_at: "2026-03-11T08:10:00Z",
    categories: { name: "Entertainment", color: "#f97316" },
  },
  // February — paid invoice transactions
  {
    id: "txn-008",
    user_id: "mock-user-001",
    amount: 780.00,
    description: "Monthly groceries — Pick n Pay",
    category_id: "cat-2",
    is_invoicable: true,
    status: "paid",
    invoice_id: "inv-002",
    date: "2026-02-20",
    created_at: "2026-02-20T12:00:00Z",
    categories: { name: "Groceries", color: "#10b981" },
  },
  {
    id: "txn-009",
    user_id: "mock-user-001",
    amount: 1_340.50,
    description: "Lab coat & scrubs — Clicks",
    category_id: "cat-6",
    is_invoicable: true,
    status: "paid",
    invoice_id: "inv-002",
    date: "2026-02-15",
    created_at: "2026-02-15T14:00:00Z",
    categories: { name: "Clothing", color: "#ec4899" },
  },
];

// ─── Mock Parental View ───────────────────────────────────────
export const MOCK_PARENTAL_ROWS: ParentalViewRow[] = MOCK_TRANSACTIONS
  .filter((t) => t.status === "invoiced" && t.is_invoicable)
  .map((t) => ({
    id: t.id,
    amount: t.amount,
    description: t.description,
    category_name: t.categories?.name ?? null,
    category_color: t.categories?.color ?? null,
    status: t.status,
    date: t.date,
    invoice_id: t.invoice_id,
    month_label: "March 2026",
  }));

// ─── Derived stats (used in dashboard) ────────────────────────
export function getMockStats() {
  const totalSpend = MOCK_TRANSACTIONS.reduce((s, t) => s + t.amount, 0);
  const invoicableTotal = MOCK_TRANSACTIONS
    .filter((t) => t.is_invoicable && t.status !== "paid")
    .reduce((s, t) => s + t.amount, 0);
  const pendingCount = MOCK_TRANSACTIONS.filter((t) => t.status === "pending").length;
  return { totalSpend, invoicableTotal, pendingCount };
}

export function getMockTxnCountByInvoice(): Record<string, number> {
  const counts: Record<string, number> = {};
  MOCK_TRANSACTIONS.forEach((t) => {
    if (t.invoice_id) {
      counts[t.invoice_id] = (counts[t.invoice_id] ?? 0) + 1;
    }
  });
  return counts;
}

export const MOCK_PARENTAL_KEY = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

// ─── Mock Parental Links ──────────────────────────────────────
export const MOCK_PARENTAL_LINKS: ParentalLink[] = [
  {
    id: "plink-001",
    user_id: "mock-user-001",
    key: MOCK_PARENTAL_KEY,
    label: "Mom",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "plink-002",
    user_id: "mock-user-001",
    key: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    label: "Dad",
    created_at: "2026-01-02T00:00:00Z",
  },
];
