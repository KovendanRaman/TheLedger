import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getInvoiceWithTransactions } from "@/backend/actions/data";
import {
  IS_MOCK_MODE,
  MOCK_PROFILE,
  MOCK_INVOICES,
  MOCK_TRANSACTIONS,
} from "@/backend/lib/mock-data";
import { PrintTrigger } from "@/frontend/components/print-trigger";
import type { Invoice, Transaction, UserProfile } from "@/backend/lib/types/database.types";

export const dynamic = "force-dynamic";

function formatAmount(amount: number) {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr.split("T")[0]), "dd MMM yyyy");
  } catch {
    return dateStr;
  }
}

export default async function InvoicePdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let invoice: Invoice;
  let txns: Transaction[];
  let profile: UserProfile | null;

  if (IS_MOCK_MODE) {
    const mockInv = MOCK_INVOICES.find((i) => i.id === id);
    if (!mockInv) notFound();
    invoice = mockInv;
    txns = (MOCK_TRANSACTIONS as Transaction[]).filter((t) => t.invoice_id === id);
    profile = MOCK_PROFILE as UserProfile;
  } else {
    const data = await getInvoiceWithTransactions(id);
    if (!data) notFound();
    ({ invoice, txns, profile } = data);
  }

  const generatedDate = formatDate(invoice.generated_at);
  const fullName = profile?.full_name ?? "Student";
  const email = profile?.email ?? "";
  const isPaid = invoice.status === "paid";

  return (
    <>
      {/* Print / Save as PDF button — hidden during actual printing */}
      <PrintTrigger />

      {/*
        Page: A4-ish proportions, white background.
        print:shadow-none removes the drop-shadow in the actual PDF.
      */}
      <div className="min-h-screen bg-gray-100 print:bg-white flex items-start justify-center py-10 print:py-0">
        <div
          className="bg-white w-full max-w-[794px] min-h-[1123px] shadow-2xl print:shadow-none p-14 print:p-10 flex flex-col"
          style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: "#6366f1" }}
                >
                  L
                </div>
                <span className="text-2xl font-bold text-gray-900 tracking-tight">
                  The Ledger
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-[52px]">
                Student Expense Tracker
              </p>
            </div>

            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                STATEMENT
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Generated: {generatedDate}
              </p>
              <div className="mt-2">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={
                    isPaid
                      ? { backgroundColor: "#d1fae5", color: "#065f46" }
                      : { backgroundColor: "#e0e7ff", color: "#4338ca" }
                  }
                >
                  {isPaid ? "Settled" : "Awaiting Payment"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-gray-200 mb-8" />

          {/* ── Bill To / Statement Details ── */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Prepared For
              </p>
              <p className="text-base font-bold text-gray-900">{fullName}</p>
              {email && (
                <p className="text-sm text-gray-500 mt-0.5">{email}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Statement Details
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Period:</span>{" "}
                {invoice.month_label}
              </p>
              <p className="text-sm text-gray-700 mt-0.5">
                <span className="font-semibold">Reference:</span>{" "}
                <span className="font-mono text-xs">{invoice.id.slice(0, 8).toUpperCase()}</span>
              </p>
              <p className="text-sm text-gray-700 mt-0.5">
                <span className="font-semibold">Transactions:</span>{" "}
                {txns.length}
              </p>
            </div>
          </div>

          {/* ── Transaction Table ── */}
          <div className="flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr
                  style={{ backgroundColor: "#6366f1" }}
                  className="text-white"
                >
                  <th className="text-left text-xs font-bold uppercase tracking-widest px-4 py-3 rounded-tl-lg">
                    Date
                  </th>
                  <th className="text-left text-xs font-bold uppercase tracking-widest px-4 py-3">
                    Description
                  </th>
                  <th className="text-left text-xs font-bold uppercase tracking-widest px-4 py-3">
                    Category
                  </th>
                  <th className="text-right text-xs font-bold uppercase tracking-widest px-4 py-3 rounded-tr-lg">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {txns.map((txn, i) => (
                  <tr
                    key={txn.id}
                    style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(txn.date ?? txn.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {txn.description}
                    </td>
                    <td className="px-4 py-3">
                      {txn.categories ? (
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: `${txn.categories.color}20`,
                            color: txn.categories.color,
                          }}
                        >
                          {txn.categories.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right font-mono text-gray-900 whitespace-nowrap">
                      {formatAmount(txn.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {txns.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-10">
                No transactions found for this statement.
              </p>
            )}
          </div>

          {/* ── Total ── */}
          <div className="mt-6 flex justify-end">
            <div className="w-64">
              <div className="h-px bg-gray-200 mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">Subtotal</span>
                <span className="text-sm font-bold font-mono text-gray-900">
                  {formatAmount(invoice.total_amount)}
                </span>
              </div>
              <div
                className="mt-3 flex justify-between items-center px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#6366f1" }}
              >
                <span className="text-sm font-bold text-white uppercase tracking-wide">
                  Total Due
                </span>
                <span className="text-lg font-bold font-mono text-white">
                  {formatAmount(invoice.total_amount)}
                </span>
              </div>
              {isPaid && (
                <div className="mt-2 flex justify-between items-center px-4 py-2 rounded-xl bg-emerald-50">
                  <span className="text-xs font-bold text-emerald-700">
                    ✓ Payment Received
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-700">
                    {formatAmount(invoice.total_amount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Generated by{" "}
              <span className="font-semibold text-gray-500">The Ledger</span>{" "}
              · Student Expense Tracker
            </p>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Global print styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}
