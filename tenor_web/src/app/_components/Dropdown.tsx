"use client";

import React, { type ButtonHTMLAttributes, useRef, useState } from "react";
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
  const [openDirection, setOpenDirection] = useState<
    "top-right" | "top-left" | "bottom-right" | "bottom-left"
  >("top-right");
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (!isOpen) {
      setOpenDirection(positionDropdown());
    }
    setIsOpen(!isOpen);
  };

  function positionDropdown() {
    if (!ref.current || !dropdownRef.current) return "top-right";

    const triggerRect = ref.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    console.log(dropdownRect);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const dropdownWidth = dropdownRect.width * 2;
    const dropdownHeight = dropdownRect.height * 2;

    let top = triggerRect.bottom;
    let left = triggerRect.right - dropdownWidth; // Align to the right of the trigger

    let vertAlignment = "top";
    let horiAlignment = "right";

    // Check if dropdown goes off-screen vertically
    if (top + dropdownHeight > viewportHeight) {
      top = triggerRect.top - dropdownHeight; // Position above trigger
      vertAlignment = "bottom";
    }

    // Check if dropdown goes off-screen horizontally
    if (left < 0) {
      // Check if left edge is off-screen
      left = 0; // Align to left edge of viewport
    } else if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth; // align to right edge of viewport.
      horiAlignment = "left";
    }

    // Apply the calculated positions
    dropdownRef.current.style.top = top + "px";
    dropdownRef.current.style.left = left + "px";

    return (vertAlignment + "-" + horiAlignment) as
      | "top-right"
      | "top-left"
      | "bottom-right"
      | "bottom-left";
  }

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      ref={ref}
    >
      <button onClick={toggleOpen}>{label}</button>
      <div
        className={cn(
          "pointer-events-none fixed z-50 flex scale-x-50 scale-y-50 flex-col gap-0 overflow-hidden rounded-lg border border-app-border bg-white text-app-text opacity-0 shadow-lg transition",
          {
            "pointer-events-auto translate-y-0 scale-x-100 scale-y-100 opacity-100":
              !!isOpen,
            "origin-top-right": openDirection === "top-right",
            "origin-top-left": openDirection === "top-left",
            "origin-bottom-right": openDirection === "bottom-right",
            "origin-bottom-left": openDirection === "bottom-left",
          },
          menuClassName,
        )}
        ref={dropdownRef}
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
      className={cn("w-full whitespace-nowrap px-3 py-2 text-left", className)}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}

interface DropdownButtonProps extends DropdownItemProps {
  dontCloseOnClick?: boolean;
}

export function DropdownButton({
  children,
  className,
  dontCloseOnClick,
  ...props
}: DropdownButtonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "w-full whitespace-nowrap px-3 py-2 text-left transition hover:bg-slate-100",
        className,
      )}
      {...props}
      onClick={(e) => {
        if (dontCloseOnClick) e.stopPropagation();
        props.onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
