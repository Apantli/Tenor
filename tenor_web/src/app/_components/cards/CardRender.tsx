import React, { type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { sprintsRouter } from "~/server/api/routers/sprints";
import TagComponent from "../TagComponent";
import { useFormatUserStoryScrumId } from "~/app/_hooks/scrumIdHooks";
import { sizeToColor } from "../specific-pickers/SizePillComponent";

interface Props {
  userStory: inferRouterOutputs<
    typeof sprintsRouter
  >["getUserStoryPreviewsBySprint"]["userStories"][0];
  showBackground?: boolean;
}

export default function CardRender({
  userStory,
  showBackground = false,
}: Props & PropsWithChildren & React.HTMLProps<HTMLDivElement>) {
  const formatUserStoryScrumId = useFormatUserStoryScrumId();

  return (
    <div
      className={cn({
        "group relative flex w-full cursor-pointer select-none rounded-lg border border-app-border bg-white p-2 py-4 shadow-xl transition duration-100":
          showBackground,
      })}
    >
      <div className={cn("flex w-full flex-col items-start gap-2")}>
        <div>
          <span className="font-semibold">
            {formatUserStoryScrumId(userStory.scrumId)}:{" "}
          </span>
          {userStory.name}
        </div>
        {(userStory.size !== undefined || userStory.tags.length > 0) && (
          <div className="flex gap-2">
            {userStory.size && (
              <TagComponent reducedPadding color={sizeToColor[userStory.size]}>
                {userStory.size}
              </TagComponent>
            )}
            {userStory.tags.slice(0, 2).map((tag) => (
              <TagComponent
                key={tag.id}
                reducedPadding
                color={tag.color}
                className="max-w-20 truncate"
              >
                {tag.name}
              </TagComponent>
            ))}
            {userStory.tags.length > 2 && (
              <TagComponent
                reducedPadding
                data-tooltip-id="tooltip"
                data-tooltip-html={userStory.tags
                  .slice(2)
                  .map((tag) => tag.name)
                  .join("<br>")}
              >
                +{userStory.tags.length - 2}
              </TagComponent>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
