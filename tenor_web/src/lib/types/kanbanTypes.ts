import type {
  BacklogItemAndTaskDetailType,
  AnyBacklogItemType,
  Size,
} from "./firebaseSchemas";
import type { Tag, WithId } from "./firebaseSchemas";

// Only information needed by the kanban board columns / selectable cards
export interface KanbanCard {
  id: string;
  cardType: BacklogItemAndTaskDetailType;
  scrumId: number;
  name: string;
  size: Size | "";
  tags: WithId<Tag>[];
  columnId: string;
  assigneeIds: string[];
  sprintId: string | undefined;
  priorityId: string | undefined;
}

export interface KanbanTaskCard extends KanbanCard {
  itemId: string;
  itemType: AnyBacklogItemType;
}
export interface KanbanItemCard extends KanbanCard {
  cardType: AnyBacklogItemType;
}
