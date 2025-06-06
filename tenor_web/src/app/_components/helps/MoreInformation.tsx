import HelpIcon from "@mui/icons-material/Help";
import { cn } from "~/lib/helpers/utils";

// make an export type for size
export type IconSize = "small" | "medium" | "large";

interface Props {
  label: string;
  size: IconSize;
  className?: string;
}

export default function MoreInformation({ label, size, className }: Props) {
  const sizeN: number = (() => {
    switch (size) {
      case "small":
        return 15;
      case "medium":
        return 20;
      case "large":
        return 25;
      default:
        return 15;
    }
  })();
  return (
    <HelpIcon
      className={cn("text-gray-500", className)}
      data-tooltip-id="tooltip"
      data-tooltip-content={label}
      data-tooltip-place="top-start"
      style={{ width: sizeN }}
    />
  );
}
