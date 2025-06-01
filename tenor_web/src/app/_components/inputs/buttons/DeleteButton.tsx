import { cn } from "~/lib/helpers/utils";
import LoadingSpinner from "../../LoadingSpinner";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import BaseButton, { type BaseButtonProps } from "./BaseButton";
import { type PropsWithChildren } from "react";

interface Props {
  loading?: boolean;
  floatingSpinner?: boolean;
  removeDeleteIcon?: boolean;
}

export default function DeleteButton({
  children,
  className,
  loading,
  floatingSpinner,
  removeDeleteIcon,
  ...props
}: BaseButtonProps & Props & PropsWithChildren) {
  return (
    <BaseButton
      className={cn(
        "flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-app-fail p-2 px-4 text-white transition hover:bg-app-hover-fail disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:bg-app-fail",
        {
          relative: floatingSpinner,
        },
        className,
      )}
      data-cy="delete-button"
      {...props}
      disabled={loading ?? ("disabled" in props && props.disabled)}
    >
      <div className="flex gap-2">
        {!removeDeleteIcon && <DeleteIcon />}
        {children}
      </div>

      {loading && (
        <span className={cn({ "absolute right-3": floatingSpinner })}>
          <LoadingSpinner />
        </span>
      )}
    </BaseButton>
  );
}
