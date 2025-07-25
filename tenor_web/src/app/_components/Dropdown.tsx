"use client";

import React, {
  createContext,
  type HTMLAttributes,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "~/lib/helpers/utils";
import useClickOutside from "../_hooks/useClickOutside";
import { type ClassNameValue } from "tailwind-merge";
import useWindowResize from "../_hooks/windowHooks";
import useAfterScroll from "../_hooks/useAfterScroll";
import BaseButton, { type BaseButtonProps } from "./inputs/buttons/BaseButton";
import Portal from "./Portal";
import usePersistentState from "../_hooks/usePersistentState";

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
  allowMove?: boolean;
  uniqueKey?: string;
  place?: "top" | "bottom" | "left" | "right";
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
  allowMove,
  uniqueKey,
  place,
  ...props
}: Props & HTMLAttributes<HTMLDivElement>) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<
    "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center-center"
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
      handleClose();
    }
  }, [close]);

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
      handleClose();
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
      handleClose();
    }
    setIsOpen(!isOpen);
    setOpenState?.(!isOpen);
  };

  const handleClose = () => {
    onClose?.();
  };

  type Alignment = "top-left" | "top-right" | "bottom-left" | "bottom-right";

  function positionDropdown(multiplier: number): Alignment {
    if (!ref.current || !dropdownRef.current) return "top-right";

    const triggerRect = ref.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();

    const dropdownWidth = dropdownRect.width * multiplier;
    const dropdownHeight = dropdownRect.height * multiplier;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let vertAlignment: "top" | "bottom" | "center" = "top";
    let horiAlignment: "left" | "right" | "center" = "right";

    switch (place) {
      case "top":
        top = triggerRect.top - dropdownHeight + window.scrollY;
        left = triggerRect.right - dropdownWidth + window.scrollX;
        vertAlignment = "bottom";
        break;
      case "left":
        top = triggerRect.top + window.scrollY;
        left = triggerRect.left - dropdownWidth + window.scrollX;
        horiAlignment = "right";
        break;
      case "right":
        top = triggerRect.top + window.scrollY;
        left = triggerRect.right + window.scrollX;
        horiAlignment = "left";
        break;
      case "bottom":
      default:
        top = triggerRect.bottom + window.scrollY;
        left = triggerRect.right - dropdownWidth + window.scrollX;
        vertAlignment = "top";
        break;
    }

    // Dynamic vertical overflow correction
    const overflowsTop = top < window.scrollY;
    const overflowsBottom =
      top + dropdownHeight > window.scrollY + viewportHeight;
    if (place === "top" && overflowsTop) {
      // Flip to bottom
      top = triggerRect.bottom + window.scrollY;
      vertAlignment = "top";
    } else if (place === "bottom" && overflowsBottom) {
      // Flip to top
      top = triggerRect.top - dropdownHeight + window.scrollY;
      vertAlignment = "bottom";
    }

    // Dynamic horizontal overflow correction
    const overflowsLeft = left < 0;
    const overflowsRight =
      left + dropdownWidth > window.scrollX + viewportWidth;
    if (place === "left" && overflowsLeft) {
      // Flip to right
      left = triggerRect.right + window.scrollX;
      horiAlignment = "left";
    } else if (place === "right" && overflowsRight) {
      // Flip to left
      left = triggerRect.left - dropdownWidth + window.scrollX;
      horiAlignment = "right";
    }

    // Final clamps to keep within viewport if needed
    top = Math.max(
      window.scrollY,
      Math.min(top, window.scrollY + viewportHeight - dropdownHeight),
    );
    left = Math.max(
      window.scrollX,
      Math.min(left, window.scrollX + viewportWidth - dropdownWidth),
    );

    initialPositionRef.current = {
      x: left,
      y: top,
    };

    if (positionRef.current.x != 0 || positionRef.current.y != 0) {
      left = positionRef.current.x;
      top = positionRef.current.y;
      top = Math.max(
        window.scrollY,
        Math.min(top, window.scrollY + viewportHeight - dropdownHeight),
      );
      left = Math.max(
        window.scrollX,
        Math.min(left, window.scrollX + viewportWidth - dropdownWidth),
      );
      vertAlignment = "center";
      horiAlignment = "center";
    }

    dropdownRef.current.style.top = `${top}px`;
    dropdownRef.current.style.left = `${left}px`;
    dropdownRef.current.style.position = "absolute";

    return `${vertAlignment}-${horiAlignment}` as Alignment;
  }

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition, resetPosition] = usePersistentState(
    { x: 0, y: 0 },
    `dropdownpos-${uniqueKey}`,
  );

  const positionRef = useRef(position);
  const initialPositionRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!allowMove || !dropdownRef.current) return;
    e.preventDefault();
    const rect = dropdownRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const x = Math.max(
        0,
        Math.min(
          e.clientX - dragOffset.x,
          window.innerWidth - (dropdownRef.current?.offsetWidth ?? 0),
        ),
      );
      const y = Math.max(
        0,
        Math.min(
          e.clientY - dragOffset.y,
          window.innerHeight - (dropdownRef.current?.offsetHeight ?? 0),
        ),
      );
      setPosition({ x, y });
      positionRef.current = { x, y };
      setOpenDirection("center-center");
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (
          Math.abs(positionRef.current.x - initialPositionRef.current.x) < 30 &&
          Math.abs(positionRef.current.y - initialPositionRef.current.y) < 30
        ) {
          resetPosition();
          positionRef.current = { x: 0, y: 0 };
          setOpenDirection(positionDropdown(1));
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const [dropdownTreeApi, dropdownElements] = useDropdownTree();
  const parentDropdown = useParentDropdown();

  useEffect(() => {
    const nodes = [ref, dropdownRef];

    for (const node of nodes) {
      dropdownTreeApi.register(node);
      parentDropdown?.register(node);
    }

    return () => {
      for (const node of nodes) {
        dropdownTreeApi.unregister(node);
        parentDropdown?.unregister(node);
      }
    };
  }, []);

  // Used to close the menu when the user clicks outside of it
  useClickOutside(
    Array.from(dropdownElements).map((ref) => ref.current),
    () => {
      if (isOpen) {
        setIsOpen(false);
        setOpenState?.(false);
        handleClose();
      }
    },
  );

  return (
    <DropdownTreeContext.Provider value={dropdownTreeApi}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-visible",
          className,
        )}
        ref={ref}
        {...props}
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
                "origin-center": openDirection === "center-center",
              },
              menuClassName,
            )}
            ref={dropdownRef}
            data-cy="dropdown"
            style={{
              top: allowMove ? `${position.y}px` : undefined,
              left: allowMove ? `${position.x}px` : undefined,
              position: "absolute",
              cursor: allowMove ? "move" : "default",
            }}
            onMouseDown={handleMouseDown}
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
    </DropdownTreeContext.Provider>
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

interface DropdownContextType {
  register: (el: React.RefObject<HTMLElement>) => void;
  unregister: (el: React.RefObject<HTMLElement>) => void;
}

const DropdownTreeContext = createContext<DropdownContextType | null>(null);

function useParentDropdown() {
  return useContext(DropdownTreeContext);
}

function useDropdownTree() {
  const [elements, setElements] = useState<Set<React.RefObject<HTMLElement>>>(
    new Set(),
  );

  const api: DropdownContextType = {
    register: (el: React.RefObject<HTMLElement>) => {
      elements.add(el);
      setElements(new Set(elements));
    },
    unregister: (el: React.RefObject<HTMLElement>) => {
      elements.delete(el);
      setElements(new Set(elements));
    },
  };

  return [api, elements] as const;
}
