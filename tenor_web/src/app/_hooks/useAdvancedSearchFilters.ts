import type { UserPreview } from "~/lib/types/detailSchemas";
import type { Sprint, Tag, WithId } from "~/lib/types/firebaseSchemas";
import type { KanbanCard } from "~/lib/types/kanbanTypes";
import usePersistentState from "./usePersistentState";

export interface AdvancedSearchFilters {
  tags: WithId<Tag>[];
  sizes: WithId<Tag>[];
  priorities: WithId<Tag>[];
  assignee: WithId<UserPreview> | undefined;
  sprint: WithId<Sprint> | undefined;
}

export default function useAdvancedSearchFilters(key: string) {
  return usePersistentState<AdvancedSearchFilters>(
    {
      tags: [],
      sizes: [],
      priorities: [],
      assignee: undefined,
      sprint: undefined,
    },
    `advanced-search-${key}`,
  );
}

export function matchesSearchFilters(
  val: KanbanCard | undefined,
  filter: string,
  advancedFilters: AdvancedSearchFilters,
): val is KanbanCard {
  const { tags, sizes, priorities, assignee, sprint } = advancedFilters;
  if (val === undefined) return false;

  if (filter && !val.name.toLowerCase().includes(filter.toLowerCase()))
    return false;
  if (
    tags.length > 0 &&
    !val.tags.some((tag) => tags.some((t) => t.id === tag.id))
  )
    return false;
  if (
    priorities.length > 0 &&
    val.priorityId &&
    !priorities.some((tag) => tag.id === val.priorityId)
  )
    return false;
  if (sizes.length > 0 && val.size && !sizes.some((tag) => tag.id === val.size))
    return false;
  if (assignee && !val.assigneeIds.includes(assignee.id)) return false;
  if (sprint && val.sprintId !== sprint.id) return false;

  return true;
}
