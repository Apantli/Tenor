import type { inferRouterOutputs } from "@trpc/server";
import React from "react";
import type { sprintsRouter } from "~/server/api/routers/sprints";
import CardColumn from "./CardColumn";
import type { ClassNameValue } from "tailwind-merge";
import CardRender from "./CardRender";

interface Props {
  userStories: inferRouterOutputs<
    typeof sprintsRouter
  >["getUserStoryPreviewsBySprint"]["userStories"][string][];
  selection: Set<string>;
  setSelection: (newSelection: Set<string>) => void;
  setDetailId: (detailId: string) => void;
  setShowDetail: (showDetail: boolean) => void;
  isLoading?: boolean;
  header?: React.ReactNode;
  className?: ClassNameValue;
  dndId: string;
  lastDraggedUserStoryId: string | null;
}

export default function UserStoryCardColumn({
  userStories,
  selection,
  setSelection,
  setDetailId,
  setShowDetail,
  isLoading,
  header,
  className,
  dndId,
  lastDraggedUserStoryId,
}: Props) {
  return (
    <CardColumn
      lastDraggedUserStoryId={lastDraggedUserStoryId}
      dndId={dndId}
      cards={userStories}
      selection={selection}
      setSelection={setSelection}
      setDetailId={setDetailId}
      setShowDetail={setShowDetail}
      isLoading={isLoading}
      header={header}
      className={className}
      renderCard={(userStory) => <CardRender userStory={userStory} />}
    />
  );
}
