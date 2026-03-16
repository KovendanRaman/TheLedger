import { eq, and, desc } from "drizzle-orm";
import { db } from "@/backend/lib/db";
import {
  parentalLinks,
  users,
  transactions,
  categories,
  invoices,
} from "@/backend/lib/db/schema";
import { formatCurrency, formatDate } from "@/backend/lib/utils";
import { CategoryBadge } from "@/frontend/components/category-badge";
import { StatusBadge } from "@/frontend/components/status-badge";
import { BookOpen, ShieldCheck, AlertCircle } from "lucide-react";
import type { ParentalViewRow } from "@/backend/lib/types/database.types";
import {
  IS_MOCK_MODE,
  MOCK_PARENTAL_ROWS,
  MOCK_PARENTAL_KEY,
} from "@/backend/lib/mock-data";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ parental_key: string }>;
}

export default async function ParentalViewPage({ params }: Props) {
  const { parental_key } = await params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(parental_key)) {
    return <InvalidLink />;
  }

  let rows: ParentalViewRow[];

  if (IS_MOCK_MODE) {
    rows = parental_key === MOCK_PARENTAL_KEY ? MOCK_PARENTAL_ROWS : [];
  } else {
    // Look up the parental link and verify sharing is enabled
    const linkResult = await db
      .select({
        userId: parentalLinks.userId,
        isSharingEnabled: users.isSharingEnabled,
      })
      .from(parentalLinks)
      .innerJoin(users, eq(parentalLinks.userId, users.id))
      .where(eq(parentalLinks.key, parental_key))
      .limit(1);

    if (!linkResult[0] || !linkResult[0].isSharingEnabled) {
      return <InvalidLink />;
    }

    const userId = linkResult[0].userId;

    // Fetch invoiced transactions with joins
    const txnRows = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        description: transactions.description,
        status: transactions.status,
        date: transactions.date,
        invoiceId: transactions.invoiceId,
        categoryName: categories.name,
        categoryColor: categories.color,
        monthLabel: invoices.monthLabel,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(invoices, eq(transactions.invoiceId, invoices.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.isInvoicable, true),
          eq(transactions.status, "invoiced")
        )
      )
      .orderBy(desc(transactions.date));

    rows = txnRows.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      description: r.description,
      category_name: r.categoryName ?? null,
      category_color: r.categoryColor ?? null,
      status: r.status,
      date: r.date,
      invoice_id: r.invoiceId ?? null,
      month_label: r.monthLabel ?? null,
    }));
  }

  // Group by invoice month
  const grouped: Record<string, ParentalViewRow[]> = {};
  rows.forEach((row) => {
    const label = row.month_label ?? "Unassigned";
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(row);
  });

  const invoicedTotal = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-8 border-b border-border/40 bg-white">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2.5 rounded-[1.25rem] gradient-primary glow-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">The Ledger</h1>
              <p className="text-[13px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wider">Parent Statement</p>
            </div>
          </div>

          <div className="p-6 rounded-[1.5rem] border border-border/50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
            <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Outstanding Total</p>
            <p className="text-[2.5rem] leading-none font-bold font-mono tracking-tight text-foreground">
              {formatCurrency(invoicedTotal)}
            </p>
            <p className="text-sm font-medium text-muted-foreground mt-3 bg-secondary/50 inline-block px-3 py-1.5 rounded-full">
              {rows.length} invoiced item{rows.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Trust badge */}
      <div className="px-5 py-3.5 bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-[13px] font-medium text-emerald-700 leading-snug">
            Read-only private statement.
          </p>
        </div>
      </div>

      {/* Transactions grouped by month */}
      <div className="px-5 py-8 max-w-md mx-auto">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[1.5rem] border border-border/50 shadow-sm mt-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold">No invoiced items</p>
            <p className="text-muted-foreground text-[13px] mt-1">
              Your student hasn&apos;t generated a statement yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([monthLabel, items]) => {
              const monthTotal = items.reduce((s, r) => s + r.amount, 0);
              return (
                <div key={monthLabel}>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-[15px] font-bold text-foreground">{monthLabel}</h2>
                    <span className="text-[15px] font-mono font-bold text-primary">
                      {formatCurrency(monthTotal)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-white border border-border/50 shadow-sm"
                      >
                        <div
                          className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: row.category_color ? `${row.category_color}15` : "#6366f115" }}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: row.category_color ?? "#6366f1" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold text-foreground truncate pl-1">
                            {row.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 pl-1">
                            {row.category_name && (
                              <CategoryBadge name={row.category_name} color={row.category_color ?? undefined} />
                            )}
                            <span className="text-xs font-medium text-muted-foreground">
                              {formatDate(row.date)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-bold font-mono text-foreground">
                            {formatCurrency(row.amount)}
                          </p>
                          <StatusBadge status={row.status} className="mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-8 border-t border-border/40 text-center bg-white/50">
        <p className="text-[13px] font-medium text-muted-foreground px-4">
          Powered by <strong className="text-foreground">The Ledger</strong>
          <br /><span className="opacity-70">A read-only student statement.</span>
        </p>
      </div>
    </div>
  );
}

function InvalidLink() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="text-center max-w-sm w-full bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-border/50">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-3 tracking-tight">Invalid Statement</h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed font-medium">
          This link is invalid or sharing has been disabled by the student.
          Please ask them to share a new link.
        </p>
      </div>
    </div>
  );
}
