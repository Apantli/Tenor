"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SelectedNodeContextType = {
  selectedId: string;
  setSelectedId: (id: string) => void;
  showDetail: boolean;
  setShowDetail: (show: boolean) => void;
};

const SelectedNodeContext = createContext<SelectedNodeContextType | undefined>(
  undefined,
);

export function SelectedNodeProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [showDetail, setShowDetail] = useState(false);

  return (
    <SelectedNodeContext.Provider
      value={{
        selectedId,
        setSelectedId,
        showDetail,
        setShowDetail,
      }}
    >
      {children}
    </SelectedNodeContext.Provider>
  );
}

export function useSelectedNode() {
  const context = useContext(SelectedNodeContext);
  if (!context) {
    throw new Error(
      "useSelectedNode must be used within a SelectedNodeProvider",
    );
  }
  return context;
}
