import React, { type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import LoadingSpinner from "../LoadingSpinner";
import BaseButton, { type BaseButtonProps } from "./BaseButton";

interface Props {
  loading?: boolean;
  floatingSpinner?: boolean;
  asSpan?: boolean;
  showBorderOnHover?: boolean;
}

export default function SecondaryButton({
  className,
  loading,
  children,
  floatingSpinner,
  asSpan,
  showBorderOnHover,
  ...props
}: BaseButtonProps & Props & PropsWithChildren) {
  return (
    <BaseButton
      className={cn(
        "flex h-10 justify-center gap-2 whitespace-nowrap rounded-lg border border-app-border p-2 px-4 text-app-text transition hover:bg-app-hover-border disabled:cursor-not-allowed disabled:bg-white disabled:opacity-60",
        {
          relative: floatingSpinner,
          "border-transparent hover:border-app-border hover:bg-transparent":
            showBorderOnHover,
        },
        className,
      )}
      {...props}
      disabled={loading ?? ("disabled" in props && props.disabled)}
      asSpan={asSpan}
    >
      {children}
      {loading && (
        <span className={cn({ "absolute right-3": floatingSpinner })}>
          <LoadingSpinner color="primary" />
        </span>
      )}
    </BaseButton>
  );
}
