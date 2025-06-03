import React, { useEffect, useRef, useState } from "react";
import { getBadContrastColorsText } from "~/lib/helpers/colorUtils";
import { cn } from "~/lib/helpers/utils";

interface Props {
  color?: string;
  onDelete?: () => void;
  reducedPadding?: boolean;
  expanded?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children?: string;
}
export default function TagComponent({
  color,
  children,
  onDelete,
  reducedPadding,
  expanded,
  onClick,
  className,
  disabled = false,

  ...props
}: Props & React.HTMLAttributes<HTMLDivElement>) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth <= el.clientWidth);
    }
  }, [children]);

  const style = {
    backgroundColor: `${color}0E`,
    color: color,
    borderColor: `${color}40`,
  };

  if (color && getBadContrastColorsText.hasOwnProperty(color)) {
    style.color = getBadContrastColorsText[color]; // Ensure text is readable on bad contrast colors
  }

  return (
    <div
      className={cn(
        "flex h-8 items-center justify-between gap-1 rounded-3xl border px-2 text-sm",
        {
          "border border-app-border": !color,
          "h-auto px-2 py-0": reducedPadding,
          "gap-2 px-3": expanded,
          "cursor-pointer transition hover:bg-app-hover-border":
            onClick !== undefined,
          "transition has-[button:hover]:border-app-fail has-[button:hover]:bg-white has-[button:hover]:text-app-fail":
            onDelete !== undefined && !disabled,
        },
        className,
      )}
      style={style}
      data-tooltip-id="tooltip"
      data-tooltip-content={children}
      data-tooltip-hidden={isTruncated}
      data-tooltip-delay-show={500}
      {...props}
      onClick={onClick}
    >
      <span className="w-full truncate text-center" ref={textRef}>
        {children}
      </span>
      {onDelete !== undefined && !disabled && (
        <button
          className="mb-[3px] flex h-8 items-center text-2xl font-thin"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
}
