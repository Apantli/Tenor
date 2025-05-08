import type { inferRouterOutputs } from "@trpc/server";
import React from "react";
import type { sprintsRouter } from "~/server/api/routers/sprints";
import CardColumn from "./CardColumn";
import type { ClassNameValue } from "tailwind-merge";
import ItemCardRender from "./ItemCardRender";
import {
  useFormatIssueScrumId,
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";
import type { KanbanCard } from "~/lib/types/kanbanTypes";

interface Props {
  backlogItems: inferRouterOutputs<
    typeof sprintsRouter
  >["getBacklogItemPreviewsBySprint"]["backlogItems"][string][];
  selection: Set<string>;
  setSelection: (newSelection: Set<string>) => void;
  setDetailId: (detailId: string) => void;
  setShowDetail: (showDetail: boolean) => void;
  isLoading?: boolean;
  header?: React.ReactNode;
  className?: ClassNameValue;
  dndId: string;
  lastDraggedBacklogItemId: string | null;
}

export default function BacklogItemCardColumn({
  backlogItems,
  selection,
  setSelection,
  setDetailId,
  setShowDetail,
  isLoading,
  header,
  className,
  dndId,
  lastDraggedBacklogItemId,
}: Props) {
  const cards: KanbanCard[] = backlogItems.map((item) => ({
    id: item.id,
    scrumId: item.scrumId,
    name: item.name,
    size: item.size,
    tags: item.tags,
    columnId: item.sprintId,
    cardType: item.itemType as "US" | "IS",
  }));

  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const formatIssueScrumId = useFormatIssueScrumId();

  return (
    <CardColumn
      lastDraggedItemId={lastDraggedBacklogItemId}
      dndId={dndId}
      cards={cards}
      selection={selection}
      setSelection={setSelection}
      setDetailId={setDetailId}
      setShowDetail={setShowDetail}
      isLoading={isLoading}
      header={header}
      className={className}
      renderCard={(item) => (
        <ItemCardRender
          item={item}
          scrumIdFormatter={() =>
            item.cardType === "US"
              ? formatUserStoryScrumId(item.scrumId)
              : formatIssueScrumId(item.scrumId)
          }
        />
      )}
    />
  );
}
