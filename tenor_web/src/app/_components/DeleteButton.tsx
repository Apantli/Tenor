import { type ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import LoadingSpinner from "./LoadingSpinner";
import DeleteIcon from "@mui/icons-material/DeleteOutline";

interface Props {
  children: React.ReactNode;
  className?: ClassNameValue;
  loading?: boolean;
}

export default function DeleteButton({
  children,
  className,
  loading,
  ...buttonProps
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...buttonProps}
      className={cn(
        "hover:bg-app-hover-fail relative flex h-10 items-center gap-2 rounded-lg bg-app-fail p-2 px-4 text-white transition disabled:opacity-80",
        className,
      )}
      disabled={loading}
    >
      <DeleteIcon />
      {children}

      {loading && (
        <span className="absolute right-3">
          <LoadingSpinner color="white" />
        </span>
      )}
    </button>
  );
}
