import React from "react";
import { type ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import LoadingSpinner from "../LoadingSpinner";

interface Props {
  children: React.ReactNode;
  className?: ClassNameValue;
  loading?: boolean;
}

export default function PrimaryButton({
  children,
  className,
  loading,
  ...buttonProps
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...buttonProps}
      className={cn(
        "relative h-10 rounded-lg bg-app-primary p-2 px-4 text-white transition hover:bg-app-hover-primary disabled:opacity-80",
        className,
      )}
      disabled={loading}
    >
      {children}

      {loading && (
        <span className="absolute right-3">
          <LoadingSpinner />
        </span>
      )}
    </button>
  );
}
