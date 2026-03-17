"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

export function PrintTrigger() {
  // Auto-open the print dialog when the page loads
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="print:hidden fixed bottom-6 right-6 flex gap-3 z-50">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: "#6366f1" }}
      >
        <Printer className="w-4 h-4" />
        Save as PDF / Print
      </button>
      <button
        onClick={() => window.close()}
        className="flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-border text-sm font-semibold text-foreground shadow-lg hover:bg-muted/50 transition-colors"
      >
        Close
      </button>
    </div>
  );
}
