import React, { type PropsWithChildren } from "react";
import { type ClassNameValue } from "tailwind-merge";
import Link from "next/link";

interface ButtonProps {
  children: React.ReactNode;
  className?: ClassNameValue;
}

interface LinkProps {
  children: React.ReactNode;
  className?: ClassNameValue;
  href: string;
}

export type BaseButtonProps =
  | (ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>)
  | (LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>);

export default function BaseButton({
  children,
  ...props
}: BaseButtonProps & PropsWithChildren) {
  if ("href" in props) {
    // Render a Link component
    return <Link {...props}>{children}</Link>;
  } else {
    // Render a button
    return <span {...props}>{children}</span>;
  }
}
