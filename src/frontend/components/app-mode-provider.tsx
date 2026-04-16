"use client";

import React, { createContext, useContext } from "react";
import type { AppMode } from "@/backend/lib/types/database.types";

interface AppModeContextValue {
  appMode: AppMode;
  allowanceResetDay: number;
}

const AppModeContext = createContext<AppModeContextValue>({
  appMode: "INVOICE",
  allowanceResetDay: 1,
});

export function AppModeProvider({
  appMode,
  allowanceResetDay,
  children,
}: {
  appMode: AppMode;
  allowanceResetDay: number;
  children: React.ReactNode;
}) {
  return (
    <AppModeContext.Provider value={{ appMode, allowanceResetDay }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeContextValue {
  return useContext(AppModeContext);
}
