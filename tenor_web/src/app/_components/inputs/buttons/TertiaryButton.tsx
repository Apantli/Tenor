import React, { type PropsWithChildren } from "react";
import BaseButton, { type BaseButtonProps } from "./BaseButton";
import { cn } from "~/lib/utils";

export default function TertiaryButton({
  children,
  className,
  ...props
}: BaseButtonProps & PropsWithChildren) {
  return (
    <BaseButton
      className={cn(
        "h-10 whitespace-nowrap rounded-lg p-2 text-app-text underline underline-offset-4 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-80",
        className,
      )}
      data-cy="tertiary-button"
      {...props}
    >
      {children}
    </BaseButton>
  );
}
