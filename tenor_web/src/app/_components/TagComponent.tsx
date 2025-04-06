import React, { type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import SecondaryButton from "./buttons/SecondaryButton";

interface Props {
  color?: string;
  onDelete?: () => void;
  reducedPadding?: boolean;
  expanded?: boolean;
  onClick?: () => void;
}
export default function TagComponent({
  color,
  children,
  onDelete,
  reducedPadding,
  expanded,
  onClick,
  className,
  ...props
}: Props & PropsWithChildren & React.HTMLAttributes<HTMLDivElement>) {
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
            onDelete !== undefined,
        },
        className,
      )}
      style={{
        backgroundColor: `${color}1E`,
        color: color,
        borderColor: `${color}40`,
      }}
      {...props}
      onClick={onClick}
    >
      <span className="w-full truncate text-center">{children}</span>
      {onDelete !== undefined && (
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
