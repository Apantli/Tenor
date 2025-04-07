import type { Size, Tag } from "~/lib/types/firebaseSchemas";
import PillComponent from "../PillComponent";

interface Props {
  currentSize?: Size;
  callback: (size: Size) => void;
  className?: string;
}

export function SizePillComponent({ currentSize, callback, className }: Props) {
  const sizeTags: Tag[] = [
    { name: "XS", color: "#4A90E2", deleted: false }, // Light Blue
    { name: "S", color: "#2c9659", deleted: false }, // Green
    { name: "M", color: "#a38921", deleted: false }, // Yellow
    { name: "L", color: "#E67E22", deleted: false }, // Orange
    { name: "XL", color: "#E74C3C", deleted: false }, // Red
    { name: "XXL", color: "#8E44AD", deleted: false }, // Purple
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
