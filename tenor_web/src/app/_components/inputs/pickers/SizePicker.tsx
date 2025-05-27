import type { Size } from "~/lib/types/firebaseSchemas";
import PillComponent from "./PillComponent";
import { sizeTags, sizeToInt } from "~/lib/defaultValues/size";

interface Props {
  projectId?: string;
  currentSize?: Size;
  callback: (size: Size) => void;
  className?: string;
  disabled?: boolean;
}

export function SizePicker({
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
