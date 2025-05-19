"use client";

import Link, { type LinkProps } from "next/link";
import type {
  AnchorHTMLAttributes,
  MouseEvent,
  PropsWithChildren,
} from "react";
import { useNavigationGuardContext } from "../_hooks/useNavigationGuard";
import { useRouter } from "next/navigation";

export default function InterceptedLink({
  href,
  children,
  onClick,
  className,
  ...props
}: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & PropsWithChildren) {
  const { shouldBlock } = useNavigationGuardContext();
  const router = useRouter();

  const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return; // allow open in new tab, etc.
    }

    e.preventDefault();

    if (await shouldBlock()) {
      e.preventDefault();
    } else {
      router.push(href as string);
    }
    onClick?.(e);
  };

  return (
    <Link {...props} href={href} legacyBehavior>
      <a onClick={handleClick} className={className}>
        {children}
      </a>
    </Link>
  );
}
