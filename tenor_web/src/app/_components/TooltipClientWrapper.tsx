"use client";

import { type PropsWithChildren } from "react";

import { Tooltip } from "react-tooltip";

export default function TooltipClientWrapper({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <Tooltip id="tooltip" />
    </>
  );
}
