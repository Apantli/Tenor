import React from "react";
import { type ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import LoadingSpinner from "./LoadingSpinner";

interface Props {
  children: React.ReactNode;
  className?: ClassNameValue;
  loading?: boolean;
}

export default function SecondaryButton({
  children,
  className,
  loading,
  ...buttonProps
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...buttonProps}
      className={cn(
        "relative h-10 rounded-lg border border-app-border p-2 text-app-text transition hover:bg-app-hover-border",
        className,
      )}
      disabled={loading}
    >
      {children}

      {loading && (
        <span className="absolute right-3">
          <LoadingSpinner color="dark" />
        </span>
      )}
    </button>
  );
}
