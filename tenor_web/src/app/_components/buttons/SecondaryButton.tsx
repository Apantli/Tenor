import React, { type PropsWithChildren } from "react";
import { type ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import LoadingSpinner from "../LoadingSpinner";
import Link from "next/link";

interface ButtonProps {
  children: React.ReactNode;
  className?: ClassNameValue;
  loading?: boolean;
}

interface LinkProps {
  children: React.ReactNode;
  className?: ClassNameValue;
  loading?: boolean;
  href: string;
}

type Props =
  | (ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>)
  | (LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>);

export default function SecondaryButton({
  className,
  loading,
  children,
  ...props
}: Props & PropsWithChildren) {
  if ("href" in props) {
    // Render a Link component
    return (
      <Link
        {...props}
        className={cn(
          "relative inline-block h-10 rounded-lg border border-app-border p-2 px-4 text-app-text transition hover:bg-app-hover-border",
          className,
        )}
      >
        {children}

        {loading && (
          <span className="absolute right-3">
            <LoadingSpinner color="dark" />
          </span>
        )}
      </Link>
    );
  } else {
    // Render a button
    return (
      <button
        {...props}
        className={cn(
          "relative h-10 rounded-lg border border-app-border p-2 px-4 text-app-text transition hover:bg-app-hover-border",
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
}
