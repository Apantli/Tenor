import React, { type PropsWithChildren } from "react";
import { type ClassNameValue } from "tailwind-merge";
import Link from "next/link";

interface ButtonProps {
  children: React.ReactNode;
  className?: ClassNameValue;
  asSpan?: boolean;
}

interface LinkProps {
  children: React.ReactNode;
  className?: ClassNameValue;
  href: string;
  asSpan?: boolean;
}

export type BaseButtonProps =
  | (ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>)
  | (LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>);

export default function BaseButton({
  children,
  asSpan,
  className,
  ...props
}: BaseButtonProps & PropsWithChildren) {
  if (asSpan) {
    return <span className={className}>{children}</span>;
  }

  if ("href" in props) {
    // Render a Link component
    return (
      <Link className={className} {...props}>
        {children}
      </Link>
    );
  } else {
    // Render a button
    return (
      <button className={className} {...props}>
        {children}
      </button>
    );
  }
}
