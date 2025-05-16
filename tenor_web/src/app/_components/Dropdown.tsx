"use client";

import React, {
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "~/lib/utils";
import useClickOutside from "../_hooks/useClickOutside";
import { type ClassNameValue } from "tailwind-merge";
import useWindowResize from "../_hooks/useWindowResize";
import useAfterScroll from "../_hooks/useAfterScroll";
import BaseButton, { type BaseButtonProps } from "./buttons/BaseButton";
import Portal from "./Portal";

interface Props {
  label: React.ReactNode;
  children: React.ReactNode[] | React.ReactNode;
  className?: ClassNameValue;
  menuClassName?: ClassNameValue;
  scrollContainer?: React.RefObject<HTMLDivElement>;
  onOpen?: () => void;
  onClose?: () => void;
  disabled?: boolean;
  close?: boolean;
  setOpenState?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCloseDropdown() {
  const [close, setClose] = useState(false);

  const closeDropdown = () => {
    setClose(true);
    setTimeout(() => {
      setClose(false);
    }, 10);
  };

  return [close, closeDropdown] as const;
}

export default function Dropdown({
  label,
  children,
  className,
  menuClassName,
  scrollContainer,
  onOpen,
  onClose,
  disabled,
  close,
  setOpenState,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<
    "top-right" | "top-left" | "bottom-right" | "bottom-left"
  >("top-right");
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const startScrollPos = useRef<number | null>(null);

  const childrenArray = Array.isArray(children)
    ? children.filter((c) => !!c)
    : [children];

  useEffect(() => {
    if (close) {
      setIsOpen(false);
      setOpenState?.(false);
      onClose?.();
    }
  }, [close]);

  // Used to close the menu when the user clicks outside of it
  useClickOutside([ref, dropdownRef], () => {
    if (isOpen) {
      setIsOpen(false);
      setOpenState?.(false);
      onClose?.();
    }
  });

  useWindowResize(() => {
    if (isOpen) {
      setOpenDirection(positionDropdown(1));
      startScrollPos.current = scrollContainer?.current?.scrollTop ?? null;
    }
  });

  useAfterScroll(() => {
    if (isOpen) {
      setOpenDirection(positionDropdown(1));
      startScrollPos.current = scrollContainer?.current?.scrollTop ?? null;
    }
  });

  useAfterScroll(() => {
    if (!scrollContainer?.current || !isOpen) return;

    const currentScroll = scrollContainer.current.scrollTop;
    const scrollDiff = Math.abs(
      (startScrollPos.current ?? currentScroll) - currentScroll,
    );

    if (scrollDiff < 40) {
      setOpenDirection(positionDropdown(1));
    } else {
      setIsOpen(false);
      setOpenState?.(false);
      onClose?.();
    }
  }, scrollContainer);

  useEffect(() => {
    startScrollPos.current = scrollContainer?.current?.scrollTop ?? null;
  }, [scrollContainer]);

  const toggleOpen = () => {
    if (!isOpen) {
      setOpenDirection(positionDropdown(2));
      onOpen?.();
      startScrollPos.current = scrollContainer?.current?.scrollTop ?? null;
    } else {
      onClose?.();
    }
    setIsOpen(!isOpen);
    setOpenState?.(!isOpen);
  };

  function positionDropdown(multiplier: number) {
    if (!ref.current || !dropdownRef.current) return "top-right";

    const triggerRect = ref.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const dropdownWidth = dropdownRect.width * multiplier;
    const dropdownHeight = dropdownRect.height * multiplier;

    // Initial position — bottom-right of trigger (relative to viewport)
    let top = triggerRect.bottom + window.scrollY;
    let left = triggerRect.right - dropdownWidth + window.scrollX;

    let vertAlignment = "top";
    let horiAlignment = "right";

    // Adjust vertically if dropdown overflows the viewport
    if (top + dropdownHeight > viewportHeight + window.scrollY) {
      top = triggerRect.top - dropdownHeight + window.scrollY;
      vertAlignment = "bottom";
    }

    // Adjust horizontally if dropdown overflows the viewport
    if (left < 0) {
      left = 0;
      horiAlignment = "left";
    } else if (left + dropdownWidth > viewportWidth + window.scrollX) {
      left = viewportWidth - dropdownWidth + window.scrollX;
      horiAlignment = "left";
    }

    // Apply styles
    dropdownRef.current.style.top = `${top}px`;
    dropdownRef.current.style.left = `${left}px`;
    dropdownRef.current.style.position = "absolute"; // or "fixed" if you're using fixed positioning

    return `${vertAlignment}-${horiAlignment}` as
      | "top-right"
      | "top-left"
      | "bottom-right"
      | "bottom-left";
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-visible",
        className,
      )}
      ref={ref}
    >
      <button onClick={toggleOpen} className="w-full" disabled={!!disabled}>
        {label}
      </button>
      <Portal>
        <div
          className={cn(
            "pointer-events-none fixed z-[400000] flex scale-x-50 scale-y-50 flex-col gap-0 overflow-hidden rounded-lg border border-app-border bg-white text-app-text opacity-0 shadow-lg transition",
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
          data-cy="dropdown"
        >
          {childrenArray.map((option, i) => {
            return (
              <div
                key={i}
                className="border-b border-app-border text-base last:border-none"
                onClick={() => {
                  setIsOpen(false);
                  setOpenState?.(false);
                  onClose?.();
                }}
              >
                {option}
              </div>
            );
          })}
        </div>
      </Portal>
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
}: DropdownButtonProps & BaseButtonProps & PropsWithChildren) {
  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    if (dontCloseOnClick) e.stopPropagation();
    if (props.onClick) {
      props.onClick(
        e as React.MouseEvent<HTMLButtonElement, MouseEvent> &
          React.MouseEvent<HTMLAnchorElement, MouseEvent>,
      );
    }
  };

  return (
    <BaseButton
      className={cn(
        "inline-block w-full whitespace-nowrap px-3 py-2 text-left transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white",
        className,
      )}
      {...props}
      onClick={handleClick}
    >
      {children}
    </BaseButton>
  );
}
