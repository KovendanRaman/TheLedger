import type { Transaction, Category } from "@/backend/lib/types/database.types";
import { format, parseISO } from "date-fns";

type Period = "month" | "quarter" | "year" | "all";

const PERIOD_LABEL: Record<Period, string> = {
  month: "This Month",
  quarter: "Last 3 Months",
  year: "Last 12 Months",
  all: "All Time",
};

function fmt(amount: number) {
  return `R ${amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr.split("T")[0]), "dd MMM yyyy");
  } catch {
    return dateStr;
  }
}

export type ReportType = "Personal" | "Billable" | "Total";

export async function downloadExpensesPDF(
  txns: Transaction[],
  categories: Category[],
  period: Period,
  userName: string,
  userEmail: string,
  reportType: ReportType = "Personal"
) {
  // Dynamic import so jsPDF is only loaded client-side
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const periodLabel = PERIOD_LABEL[period];
  const generatedDate = format(new Date(), "dd MMM yyyy");
  const totalSpend = txns.reduce((s, t) => s + t.amount, 0);

  // ── Category breakdown ──────────────────────────────────────
  const catTotals: Record<string, { name: string; amount: number }> = {};
  for (const t of txns) {
    if (t.categories) {
      const key = t.category_id ?? t.categories.name;
      if (!catTotals[key]) catTotals[key] = { name: t.categories.name, amount: 0 };
      catTotals[key].amount += t.amount;
    }
  }
  const catList = Object.values(catTotals).sort((a, b) => b.amount - a.amount);
  const topCat = catList[0]?.name ?? "—";

  // ── Colours ─────────────────────────────────────────────────
  const INDIGO: [number, number, number] = [99, 102, 241];
  const INDIGO_LIGHT: [number, number, number] = [224, 231, 255];
  const INDIGO_DARK: [number, number, number] = [67, 56, 202];
  const GRAY_900: [number, number, number] = [17, 24, 39];
  const GRAY_600: [number, number, number] = [75, 85, 99];
  const GRAY_400: [number, number, number] = [156, 163, 175];
  const WHITE: [number, number, number] = [255, 255, 255];

  const W = 210; // A4 width mm
  let y = 0;

  // ── Header bar ──────────────────────────────────────────────
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, W, 28, "F");

  // Logo circle
  doc.setFillColor(...WHITE);
  doc.circle(18, 14, 7, "F");
  doc.setTextColor(...INDIGO);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("L", 18, 17.5, { align: "center" });

  // App name
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("The Ledger", 30, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${reportType} Expense Report`, 30, 18);

  // Right: EXPENSES heading + date
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("EXPENSES", W - 14, 12, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${generatedDate}`, W - 14, 18, { align: "right" });

  // Period badge
  doc.setFillColor(...INDIGO_LIGHT);
  doc.roundedRect(W - 50, 20, 36, 6, 3, 3, "F");
  doc.setTextColor(...INDIGO_DARK);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(periodLabel.toUpperCase(), W - 32, 24, { align: "center" });

  y = 36;

  // ── User info row ────────────────────────────────────────────
  doc.setTextColor(...GRAY_400);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("PREPARED FOR", 14, y);
  doc.text("REPORT DETAILS", W - 14, y, { align: "right" });

  y += 5;
  doc.setTextColor(...GRAY_900);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(userName, 14, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_600);
  if (userEmail) {
    doc.text(userEmail, 14, y + 5);
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_600);
  doc.text(`Period: ${periodLabel}`, W - 14, y, { align: "right" });
  doc.text(`Transactions: ${txns.length}`, W - 14, y + 5, { align: "right" });
  const typeText = reportType === "Total" ? "All Expenses" : `${reportType} Expenses Only`;
  doc.text(`Type: ${typeText}`, W - 14, y + 10, { align: "right" });

  y += 18;

  // ── Divider ──────────────────────────────────────────────────
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(14, y, W - 14, y);
  y += 8;

  // ── KPI summary cards ────────────────────────────────────────
  const cards = [
    { label: "TOTAL SPEND", value: fmt(totalSpend) },
    { label: "TRANSACTIONS", value: `${txns.length}` },
    { label: "TOP CATEGORY", value: topCat },
  ];
  const cardW = (W - 28 - 8) / 3;
  cards.forEach((card, i) => {
    const cx = 14 + i * (cardW + 4);
    doc.setFillColor(...INDIGO_LIGHT);
    doc.roundedRect(cx, y, cardW, 14, 2, 2, "F");
    doc.setTextColor(...INDIGO_DARK);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text(card.label, cx + 4, y + 5);
    doc.setTextColor(...GRAY_900);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, cx + 4, y + 11);
  });
  y += 20;

  // ── Transaction table ─────────────────────────────────────────
  const isTotalReport = reportType === "Total";

  const tableRows = txns.map((t) => {
    const row = [
      fmtDate(t.date ?? t.created_at),
      t.description,
      t.categories?.name ?? "—",
    ];
    if (isTotalReport) {
      row.push(t.is_invoicable ? "Billable" : "Personal");
    }
    row.push(fmt(t.amount));
    return row;
  });

  const headRow = ["Date", "Description", "Category"];
  if (isTotalReport) headRow.push("Type");
  headRow.push("Amount");

  const columnStyles: any = {
    0: { cellWidth: 28 },
    1: { cellWidth: "auto" },
    2: { cellWidth: 32 },
  };

  if (isTotalReport) {
    columnStyles[3] = { cellWidth: 22 }; // Type
    columnStyles[4] = { cellWidth: 28, halign: "right", fontStyle: "bold" }; // Amount
  } else {
    columnStyles[3] = { cellWidth: 28, halign: "right", fontStyle: "bold" }; // Amount
  }

  autoTable(doc, {
    startY: y,
    head: [headRow],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: INDIGO,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: GRAY_900,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] as [number, number, number],
    },
    columnStyles,
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on each page
      const pageH = doc.internal.pageSize.height;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.line(14, pageH - 12, W - 14, pageH - 12);
      doc.setFontSize(7);
      doc.setTextColor(...GRAY_400);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated by The Ledger · ${reportType} Expense Report`, 14, pageH - 7);
      doc.text(generatedDate, W - 14, pageH - 7, { align: "right" });
    },
  });

  // ── Total block ───────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  const totalBlockX = W - 14 - 60;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(totalBlockX, finalY, W - 14, finalY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_600);
  doc.text("Transactions", totalBlockX + 2, finalY + 5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY_900);
  doc.text(`${txns.length}`, W - 14, finalY + 5, { align: "right" });

  doc.setFillColor(...INDIGO);
  doc.roundedRect(totalBlockX, finalY + 8, 60, 10, 2, 2, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL SPEND", totalBlockX + 4, finalY + 14.5);
  doc.text(fmt(totalSpend), W - 16, finalY + 14.5, { align: "right" });

  // ── Category breakdown (if room on last page) ─────────────────
  const catY = finalY + 26;
  const pageH = doc.internal.pageSize.height;
  if (catList.length > 0 && catY + catList.length * 8 + 14 < pageH - 18) {
    doc.setTextColor(...GRAY_400);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("SPEND BY CATEGORY", 14, catY);

    catList.forEach((cat, i) => {
      const rowY = catY + 6 + i * 7;
      const pct = totalSpend > 0 ? (cat.amount / totalSpend) * 100 : 0;
      const barMaxW = 70;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_900);
      doc.text(cat.name, 14, rowY + 3);

      // Bar background
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(60, rowY, barMaxW, 3.5, 1, 1, "F");
      // Bar fill
      doc.setFillColor(...INDIGO);
      doc.roundedRect(60, rowY, Math.max(2, barMaxW * (pct / 100)), 3.5, 1, 1, "F");

      doc.setFont("helvetica", "bold");
      doc.text(fmt(cat.amount), 155, rowY + 3, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_400);
      doc.text(`${pct.toFixed(0)}%`, W - 14, rowY + 3, { align: "right" });
    });
  }

  // ── Save ─────────────────────────────────────────────────────
  const fileName = `${reportType.toLowerCase()}-expenses-${periodLabel.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
