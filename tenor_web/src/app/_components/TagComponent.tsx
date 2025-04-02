import React, { type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";

interface Props {
  color?: string;
  onDelete?: () => void;
  reducedPadding?: boolean;
}
export default function TagComponent({
  color,
  children,
  onDelete,
  reducedPadding,
  className,
  ...props
}: Props & PropsWithChildren & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-8 items-center justify-between gap-2 rounded-3xl border px-3 text-sm",
        {
          "border border-app-border": !color,
          "h-auto px-2 py-0": reducedPadding,
        },
        className,
      )}
      style={{
        backgroundColor: `${color}1E`,
        color: color,
        borderColor: `${color}40`,
      }}
      {...props}
    >
      <span className="w-full text-center">{children}</span>
      {onDelete !== undefined && (
        <button
          className="mb-[3px] flex h-8 items-center text-2xl font-thin"
          onClick={onDelete}
        >
          &times;
        </button>
      )}
    </div>
  );
}
