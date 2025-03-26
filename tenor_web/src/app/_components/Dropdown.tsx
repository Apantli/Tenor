"use client";

import React, { useRef, useState } from "react";
import { cn } from "~/lib/utils";
import useClickOutside from "../_hooks/useClickOutside";
import { ClassNameValue } from "tailwind-merge";

interface Props<T extends string> {
  options: Record<T, React.ReactNode>;
  callback: (option: T) => void;
  children: React.ReactNode;
  menuClassName?: ClassNameValue;
}

export default function Dropdown<T extends string>({
  options,
  children,
  callback,
  menuClassName,
}: Props<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Used to close the menu when the user clicks outside of it
  useClickOutside(ref, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const optionCount = Object.entries(options).length;

  return (
    <div className="relative flex items-center justify-center" ref={ref}>
      <button onClick={toggleOpen}>{children}</button>
      <div
        className={cn(
          "absolute right-0 top-full z-50 mt-2 flex origin-top-right scale-x-50 scale-y-0 flex-col gap-0 overflow-hidden rounded-lg border border-app-border bg-white text-app-text opacity-0 shadow-lg transition",
          {
            "translate-y-0 scale-x-100 scale-y-100 opacity-100": isOpen,
          },
          menuClassName,
        )}
      >
        {Object.entries(options).map(([key, value], i) => (
          <button
            key={key}
            className={cn(
              "border-app-border px-3 py-2 text-left transition hover:bg-slate-100",
              {
                "border-b": i != optionCount - 1,
              },
            )}
            onClick={() => {
              callback(key as T);
              setIsOpen(false);
            }}
          >
            {value as React.ReactNode}
          </button>
        ))}
      </div>
    </div>
  );
}
