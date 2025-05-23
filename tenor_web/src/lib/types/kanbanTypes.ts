import type {
  BacklogItemAndTaskDetailType,
  BacklogItemType,
  Size,
} from "./firebaseSchemas";

// Only information needed by the kanban board columns / selectable cards
export interface KanbanCard {
  id: string;
  cardType: BacklogItemAndTaskDetailType;
  scrumId: number;
  name: string;
  size: Size | undefined;
  tags: {
    deleted: boolean;
    id: string;
    name: string;
    color: string;
  }[];
  columnId: string;
}

export interface KanbanTaskCard extends KanbanCard {
  itemId: string;
  itemType: BacklogItemType;
}
export interface KanbanItemCard extends KanbanCard {
  cardType: BacklogItemType;
}
