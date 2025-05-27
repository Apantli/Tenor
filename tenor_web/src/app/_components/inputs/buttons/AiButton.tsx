import React from "react";
import BaseButton, { type BaseButtonProps } from "./BaseButton";
import { cn } from "~/lib/utils";
import AiIcon from "@mui/icons-material/AutoAwesome";

interface Props {
  asSpan?: boolean;
  tooltip?: string;
}

export default function AiButton({
  className,
  children,
  asSpan,
  tooltip,
  ...props
}: BaseButtonProps & Props) {
  return (
    <BaseButton
      className={cn(
        "flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-app-secondary p-2 px-4 text-white transition hover:bg-app-hover-secondary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-app-secondary",
        className,
        {
          "cursor-not-allowed opacity-60 hover:bg-app-secondary":
            "disabled" in props && props.disabled,
        },
      )}
      {...props}
      asSpan={asSpan}
      data-tooltip-id="tooltip"
      data-tooltip-content={tooltip}
      data-tooltip-hidden={tooltip === undefined}
      data-tooltip-place="top-end"
      data-tooltip-delay-show={500}
    >
      <AiIcon fontSize="small" htmlColor="white" />
      {children}
    </BaseButton>
  );
}
