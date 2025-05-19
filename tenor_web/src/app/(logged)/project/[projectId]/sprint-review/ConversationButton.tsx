"use client";

import { cn } from "~/lib/utils";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import BaseButton, {
  type BaseButtonProps,
} from "~/app/_components/buttons/BaseButton";

interface ConversationButtonProps {
  onClick?: () => void;
}

export default function ConversationButton({
  onClick,
  className,
  children,
  ...props
}: ConversationButtonProps & BaseButtonProps) {
  return (
    <BaseButton
      className={cn(
        "flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-app-primary bg-white px-3 text-app-text transition hover:bg-app-hover-border disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      <HeadphonesIcon fontSize="small" />
      {children}
    </BaseButton>
  );
}
