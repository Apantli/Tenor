import React from "react";
import { type ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/helpers/utils";
import Check from "@mui/icons-material/Check";

interface Props {
  className?: ClassNameValue;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function InputCheckbox({
  className,
  checked,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div
      className={cn(
        "flex h-4 w-4 items-center justify-center rounded-sm border border-app-border text-xs transition hover:bg-app-hover-border",
        {
          "cursor-not-allowed bg-white opacity-50 hover:bg-white": disabled,
          "border-app-hover-primary bg-app-primary hover:bg-app-hover-primary":
            checked,
        },
        className,
      )}
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        onChange(!checked);
      }}
    >
      <Check
        className={cn("text-white opacity-0 transition", {
          "opacity-100": checked,
        })}
        fontSize="inherit"
      />
    </div>
  );
}
