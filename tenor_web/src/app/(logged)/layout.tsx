"use client";

import React, { type PropsWithChildren } from "react";
import ClientAuthBoundary from "../_components/ClientAuthBoundary";

export default function LoggedLayout({ children }: PropsWithChildren) {
  return <ClientAuthBoundary>{children}</ClientAuthBoundary>;
}
