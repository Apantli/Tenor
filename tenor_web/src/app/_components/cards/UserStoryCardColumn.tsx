import type { inferRouterOutputs } from "@trpc/server";
import React from "react";
import type sprintsRouter from "~/server/api/routers/sprints";
import CardColumn from "./CardColumn";
import { useFormatUserStoryScrumId } from "~/app/_hooks/scumIdHooks";
import TagComponent from "../TagComponent";
import { sizeToColor } from "../specific-pickers/SizePillComponent";

interface Props {
  userStories: inferRouterOutputs<
    typeof sprintsRouter
  >["getUserStoryPreviewsBySprint"]["unassignedUserStories"];
  selection: Set<string>;
  setSelection: (newSelection: Set<string>) => void;
  setDetailId: (detailId: string) => void;
  setShowDetail: (showDetail: boolean) => void;
  isLoading?: boolean;
  header?: React.ReactNode;
}

export default function UserStoryCardColumn({
  userStories,
  selection,
  setSelection,
  setDetailId,
  setShowDetail,
  isLoading,
  header,
}: Props) {
  const formatUserStoryScrumId = useFormatUserStoryScrumId();

  return (
    <CardColumn
      cards={userStories}
      selection={selection}
      setSelection={setSelection}
      setDetailId={setDetailId}
      setShowDetail={setShowDetail}
      isLoading={isLoading}
      header={header}
      renderCard={(userStory) => (
        <div className="flex w-full flex-col items-start gap-2">
          <div>
            <span className="font-semibold">
              {formatUserStoryScrumId(userStory.scrumId)}:{" "}
            </span>
            {userStory.name}
          </div>
          {(userStory.size !== undefined || userStory.tags.length > 0) && (
            <div className="flex gap-2">
              {userStory.size && (
                <TagComponent
                  reducedPadding
                  color={sizeToColor[userStory.size]}
                >
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
      )}
    />
  );
}
