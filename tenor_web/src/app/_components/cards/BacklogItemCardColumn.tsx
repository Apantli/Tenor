import React from "react";
import CardColumn from "./CardColumn";
import type { ClassNameValue } from "tailwind-merge";
import ItemCardRender from "./ItemCardRender";
import { useFormatAnyScrumId } from "~/app/_hooks/scrumIdHooks";
import type { KanbanItemCard } from "~/lib/types/kanbanTypes";
import {
  type AdvancedSearchFilters,
  matchesSearchFilters,
} from "~/app/_hooks/useAdvancedSearchFilters";
import type { BacklogItemDetail } from "~/lib/types/detailSchemas";
import type { AnyBacklogItemType } from "~/lib/types/firebaseSchemas";
import { useParams } from "next/navigation";

interface Props {
  backlogItems: BacklogItemDetail[];
  selection: Set<string>;
  setSelection: (newSelection: Set<string>) => void;
  setDetailId: (detailId: string) => void;
  isLoading?: boolean;
  header?: React.ReactNode;
  className?: ClassNameValue;
  dndId: string;
  lastDraggedBacklogItemId: string | null;
  disabled?: boolean;
  disableDropping?: boolean;
  advancedFilters: AdvancedSearchFilters;
}

export default function BacklogItemCardColumn({
  backlogItems,
  selection,
  setSelection,
  setDetailId,
  isLoading,
  header,
  className,
  dndId,
  lastDraggedBacklogItemId,
  disabled = false,
  disableDropping = false,
  advancedFilters,
}: Props) {
  const cards: KanbanItemCard[] = backlogItems
    .map((item) => ({
      id: item.id,
      scrumId: item.scrumId,
      name: item.name,
      size: item.size,
      tags: item.tags,
      columnId: item.sprintId,
      cardType: item.itemType,
      assigneeIds: item.assigneeIds,
      sprintId: item.sprintId,
      priorityId: item.priorityId,
    }))
    .filter((val: KanbanItemCard | undefined) => {
      return matchesSearchFilters(val, "", advancedFilters);
    });

  const { projectId } = useParams();
  const formatAnyScrumId = useFormatAnyScrumId(projectId as string);

  return (
    <CardColumn
      disabled={disabled}
      disableDropping={disableDropping}
      lastDraggedItemId={lastDraggedBacklogItemId}
      dndId={dndId}
      cards={cards}
      selection={selection}
      setSelection={setSelection}
      setDetailId={setDetailId}
      isLoading={isLoading}
      header={header}
      className={className}
      renderCard={(item) => (
        <ItemCardRender
          disabled={disabled}
          item={item}
          scrumIdFormatter={() =>
            formatAnyScrumId(item.scrumId, item.cardType as AnyBacklogItemType)
          }
        />
      )}
    />
  );
}
