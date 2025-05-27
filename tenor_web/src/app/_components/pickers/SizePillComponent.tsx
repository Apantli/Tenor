import type { Size } from "~/lib/types/firebaseSchemas";
import PillComponent from "./PillComponent";
import { sizeTags, sizeToInt } from "~/lib/defaultProjectValues";

interface Props {
  projectId?: string;
  currentSize?: Size;
  callback: (size: Size) => void;
  className?: string;
  disabled?: boolean;
}

export function SizePillComponent({
  currentSize,
  callback,
  className,
  disabled,
}: Props) {
  const currentTag =
    currentSize !== undefined ? sizeTags[sizeToInt(currentSize)] : undefined;

  return (
    <PillComponent
      disabled={disabled}
      allTags={sizeTags}
      currentTag={currentTag}
      callBack={(tag) => callback(tag.name as Size)}
      labelClassName=""
      className={className ?? ""}
    />
  );
}

export const sizeToColor: Record<Size, string> = {
  XS: "#4A90E2", // Light Blue
  S: "#2c9659", // Green
  M: "#a38921", // Yellow
  L: "#E67E22", // Orange
  XL: "#E74C3C", // Red
  XXL: "#8E44AD", // Purple
};
