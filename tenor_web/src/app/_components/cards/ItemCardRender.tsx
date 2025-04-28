import React, { type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import TagComponent from "../TagComponent";
import { useFormatUserStoryScrumId } from "~/app/_hooks/scrumIdHooks";
import { sizeToColor } from "../specific-pickers/SizePillComponent";
import type { CardItem } from "~/server/api/routers/kanban";

interface Props {
  item: CardItem;
  showBackground?: boolean;
  scrumIdFormatter?: (scrumId: number) => string;
}

export default function ItemCardRender({
  item,
  showBackground = false,
  scrumIdFormatter,
}: Props & PropsWithChildren & React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={cn({
        "group relative flex w-full cursor-pointer select-none rounded-lg border border-app-border bg-white p-2 py-4 pl-4 shadow-xl transition duration-100":
          showBackground,
      })}
    >
      <div className={cn("flex w-full flex-col items-start gap-2")}>
        <div>
          <span className="font-semibold">
            {scrumIdFormatter ? scrumIdFormatter(item.scrumId) : item.scrumId}
            :{" "}
          </span>
          {item.name}
        </div>
        {(item.size !== undefined || item.tags.length > 0) && (
          <div className="flex gap-2">
            {item.size && (
              <TagComponent reducedPadding color={sizeToColor[item.size]}>
                {item.size}
              </TagComponent>
            )}
            {item.tags.slice(0, 2).map((tag) => (
              <TagComponent
                key={tag.id}
                reducedPadding
                color={tag.color}
                className="max-w-20 truncate"
              >
                {tag.name}
              </TagComponent>
            ))}
            {item.tags.length > 2 && (
              <TagComponent
                reducedPadding
                data-tooltip-id="tooltip"
                data-tooltip-html={item.tags
                  .slice(2)
                  .map((tag) => tag.name)
                  .join("<br>")}
              >
                +{item.tags.length - 2}
              </TagComponent>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
