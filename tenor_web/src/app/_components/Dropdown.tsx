"use client";

import React, {
  ButtonHTMLAttributes,
  PropsWithChildren,
  useRef,
  useState,
} from "react";
import { cn } from "~/lib/utils";
import useClickOutside from "../_hooks/useClickOutside";
import { type ClassNameValue } from "tailwind-merge";

interface Props {
  label: React.ReactNode;
  children: React.ReactNode[] | React.ReactNode;
  className?: ClassNameValue;
  menuClassName?: ClassNameValue;
}

export default function Dropdown({
  label,
  children,
  className,
  menuClassName,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const childrenArray = Array.isArray(children)
    ? children.filter((c) => !!c)
    : [children];

  // Used to close the menu when the user clicks outside of it
  useClickOutside(ref, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      ref={ref}
    >
      <button onClick={toggleOpen}>{label}</button>
      <div
        className={cn(
          "absolute right-0 top-full z-50 flex origin-top-right scale-x-50 scale-y-0 flex-col gap-0 overflow-hidden rounded-lg border border-app-border bg-white text-app-text opacity-0 shadow-lg transition",
          {
            "translate-y-0 scale-x-100 scale-y-100 opacity-100": isOpen,
          },
          menuClassName,
        )}
      >
        {childrenArray.map((option, i) => {
          return (
            <div
              key={i}
              className="border-b border-app-border text-base last:border-none"
              onClick={() => setIsOpen(false)}
            >
              {option}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  className?: ClassNameValue;
}

export function DropdownItem({ children, className }: DropdownItemProps) {
  return (
    <div
      className={cn("w-full px-3 py-2 text-left", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export function DropdownButton({
  children,
  className,
  ...props
}: DropdownItemProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "w-full px-3 py-2 text-left transition hover:bg-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
