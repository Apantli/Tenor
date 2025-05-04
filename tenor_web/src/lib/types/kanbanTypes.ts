// Only information needed by the kanban board columns / selectable cards
export interface KanbanCard {
  id: string;
  cardType: "US" | "IS" | "IT" | "TS"; // US = user story, IS = issue, IT = generic item, TS = task
  scrumId: number;
  name: string;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | undefined;
  tags: {
    deleted: boolean;
    id: string;
    name: string;
    color: string;
  }[];
  columnId: string;
}

export interface KanbanTaskCard extends KanbanCard {
  cardType: "TS"; // TS = task
  itemId: string;
  itemType: "US" | "IS" | "IT"; // US = user story, IS = issue, IT = generic item
}
export interface KanbanItemCard extends KanbanCard {
  cardType: "US" | "IS" | "IT"; // US = user story, IS = issue, IT = generic item
}
