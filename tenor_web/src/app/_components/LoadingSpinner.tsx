import React from "react";
import { cn } from "~/lib/utils";

interface Props {
  color?: "white" | "dark" | "primary";
}

export default function LoadingSpinner({ color }: Props) {
  return (
    <div>
      <div
        className={cn(
          "h-6 w-6 animate-spin rounded-full border-4 border-r-transparent",
          {
            "border-y-white border-l-white": color === "white",
            "border-y-app-primary border-l-app-primary": color === "primary",
            "border-y-app-text border-l-app-text": color === "dark",
          },
        )}
      ></div>
    </div>
  );
}
