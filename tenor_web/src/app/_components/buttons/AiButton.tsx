import React from "react";
import BaseButton, { BaseButtonProps } from "./BaseButton";
import { cn } from "~/lib/utils";
import AiIcon from "@mui/icons-material/AutoAwesome";

interface Props {
  asSpan?: boolean;
}

export default function AiButton({
  className,
  children,
  asSpan,
  ...props
}: BaseButtonProps & Props) {
  return (
    <BaseButton
      className={cn(
        "hover:bg-app-hover-secondary flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-app-secondary p-2 px-4 text-white transition disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-app-secondary",
        className,
        {
          "cursor-not-allowed opacity-60 hover:bg-app-secondary":
            "disabled" in props && props.disabled,
        },
      )}
      {...props}
      asSpan={asSpan}
    >
      <AiIcon fontSize="small" htmlColor="white" />
      {children}
    </BaseButton>
  );
}
