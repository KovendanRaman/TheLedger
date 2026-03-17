import React from "react";
import { Sidebar } from "@/frontend/components/sidebar";
import { AppFooter } from "@/frontend/components/app-footer";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-row">
      {/* Sidebar: sticky, takes its own width, pushes content */}
      <Sidebar />

      {/* Content column: grows to fill remaining width */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 w-full">
          {children}
        </main>
        {/* Bottom padding on mobile so footer clears the fixed bottom nav */}
        <div className="pb-28 lg:pb-0">
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
