import React from "react";
import { type ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: ClassNameValue;
}

export default function SecondaryButton({
  children,
  className,
  ...buttonProps
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...buttonProps}
      className={cn(
        "hover:bg-app-hover-border w-full rounded-lg border border-app-border p-2 transition",
        className,
      )}
    >
      {children}
    </button>
  );
}
