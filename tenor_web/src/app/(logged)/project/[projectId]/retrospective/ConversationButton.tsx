"use client";

import { cn } from "~/lib/utils";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import BaseButton, {
  type BaseButtonProps,
} from "~/app/_components/buttons/BaseButton";

export default function ConversationButton({
  className,
  children,
  ...props
}: BaseButtonProps) {
  return (
    <BaseButton
      className={cn(
        "flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border-2 border-app-primary bg-white px-3 text-app-text transition hover:bg-app-hover-border disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <HeadphonesIcon fontSize="small" />
      {children}
    </BaseButton>
  );
}
