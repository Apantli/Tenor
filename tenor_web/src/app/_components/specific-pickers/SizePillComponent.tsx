import type { Size, Tag } from "~/lib/types/firebaseSchemas";
import PillComponent from "../PillComponent";

interface Props {
  projectId?: string;
  currentSize?: Size;
  callback: (size: Size) => void;
  className?: string;
}

export const sizeToColor: Record<Size, string> = {
  XS: "#4A90E2", // Light Blue
  S: "#2c9659", // Green
  M: "#a38921", // Yellow
  L: "#E67E22", // Orange
  XL: "#E74C3C", // Red
  XXL: "#8E44AD", // Purple
};

export function SizePillComponent({ currentSize, callback, className }: Props) {
  const sizeTags: Tag[] = [
    { name: "XS", color: sizeToColor.XS, deleted: false }, // Light Blue
    { name: "S", color: sizeToColor.S, deleted: false }, // Green
    { name: "M", color: sizeToColor.M, deleted: false }, // Yellow
    { name: "L", color: sizeToColor.L, deleted: false }, // Orange
    { name: "XL", color: sizeToColor.XL, deleted: false }, // Red
    { name: "XXL", color: sizeToColor.XXL, deleted: false }, // Purple
  ] as const;

  const sizeToInt = (size: Size): 0 | 1 | 2 | 3 | 4 | 5 => {
    switch (size) {
      case "XS":
        return 0;
      case "S":
        return 1;
      case "M":
        return 2;
      case "L":
        return 3;
      case "XL":
        return 4;
      case "XXL":
        return 5;
    }
  };

  const currentTag =
    currentSize !== undefined ? sizeTags[sizeToInt(currentSize)] : undefined;

  return (
    <PillComponent
      allTags={sizeTags}
      currentTag={currentTag}
      callBack={(tag) => callback(tag.name as Size)}
      labelClassName=""
      className={className ?? ""}
    />
  );
}
