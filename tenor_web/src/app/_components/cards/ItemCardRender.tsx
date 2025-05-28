import React, { type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import TagComponent from "../TagComponent";
import { getAccentColorByCardType } from "~/utils/helpers/colorUtils";
import type { KanbanCard } from "~/lib/types/kanbanTypes";
import { sizeToColor } from "~/lib/defaultValues/size";

interface Props {
  item: KanbanCard;
  showBackground?: boolean;
  scrumIdFormatter?: (scrumId: number) => string;
}

export default function ItemCardRender({
  item,
  showBackground = false,
  scrumIdFormatter,
}: Props & PropsWithChildren & React.HTMLProps<HTMLDivElement>) {
  const accentColor = getAccentColorByCardType(item.cardType);
  return (
    <div
      className={cn({
        "w-88 min-w-88 group relative flex min-h-8 min-w-full cursor-pointer select-none overflow-hidden rounded-lg border border-app-border bg-white p-2 py-4 pb-5 pl-4 pr-7 shadow-xl transition duration-100":
          showBackground,
      })}
    >
      {showBackground && (
        <div
          className={cn("absolute bottom-0 left-0 h-2 w-full", accentColor)}
        ></div>
      )}
      <div
        className={cn(
          "wrap-properly flex w-full flex-col flex-wrap items-start gap-2",
        )}
      >
        <div className="">
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
                data-tooltip-id="tooltip"
                data-tooltip-content={tag.name}
              >
                {tag.name}
              </TagComponent>
            ))}
            {item.tags.length > 2 && (
              <TagComponent
                reducedPadding
                data-tooltip-id="tooltip"
                data-tooltip-hidden={false}
                data-tooltip-delay-show={0}
                data-tooltip-html={item.tags
                  .slice(2)
                  .map((tag) => tag.name)
                  .join("<br>")}
              >
                {`+${item.tags.length - 2}`}
              </TagComponent>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
