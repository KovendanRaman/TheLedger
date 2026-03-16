import React from "react";
import { Sidebar } from "@/frontend/components/sidebar";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F4F5FB]">
      <Sidebar />
      <main className="lg:pl-[260px] min-h-screen w-full">
        {children}
      </main>
    </div>
  );
}

