import React from "react";
import { Sidebar } from "@/frontend/components/sidebar";
import { AppFooter } from "@/frontend/components/app-footer";
import { ThemeProvider } from "@/frontend/components/theme-provider";
import { AppModeProvider } from "@/frontend/components/app-mode-provider";
import { getUserProfile } from "@/backend/actions/data";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();

  return (
    <ThemeProvider
      initialTheme={profile?.theme ?? "light"}
    >
      <AppModeProvider
        appMode={profile?.appMode ?? "INVOICE"}
        allowanceResetDay={profile?.allowanceResetDay ?? 1}
      >
        <div className="min-h-screen bg-[#F4F5FB] dark:bg-[#0f0f14] flex flex-row transition-colors duration-300">
          <Sidebar />

          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 w-full">
              {children}
            </main>
            <div className="pb-28 lg:pb-0">
              <AppFooter />
            </div>
          </div>
        </div>
      </AppModeProvider>
    </ThemeProvider>
  );
}
