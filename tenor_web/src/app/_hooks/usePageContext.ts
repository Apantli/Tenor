"use client";

import { createContext } from "react";

export type PageContextType = Record<string, string>;

export const PageContext = createContext<PageContextType | undefined>(
  undefined,
);
