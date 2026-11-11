"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  datasetId: string | null;
  setDatasetId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [datasetId, setDatasetId] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{ datasetId, setDatasetId }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
