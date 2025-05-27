import React, { type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import BaseButton, { type BaseButtonProps } from "./BaseButton";
import LoadingSpinner from "../../LoadingSpinner";

interface Props {
  loading?: boolean;
  floatingSpinner?: boolean;
  asSpan?: boolean;
  disabled?: boolean;
}

export default function PrimaryButton({
  children,
  className,
  loading,
  disabled,
  floatingSpinner,
  asSpan,
  ...props
}: BaseButtonProps & Props & PropsWithChildren) {
  return (
    <BaseButton
      className={cn(
        "flex h-10 justify-center gap-2 whitespace-nowrap rounded-lg bg-app-primary p-2 px-4 text-white transition hover:bg-app-hover-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-app-primary",
        {
          relative: floatingSpinner,
        },
        className,
      )}
      data-cy="primary-button"
      {...props}
      disabled={disabled ?? loading ?? false}
      asSpan={asSpan}
    >
      {children}
      {loading && (
        <span className={cn({ "absolute right-3": floatingSpinner })}>
          <LoadingSpinner />
        </span>
      )}
    </BaseButton>
  );
}
