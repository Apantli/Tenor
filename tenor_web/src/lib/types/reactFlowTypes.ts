import BasicNode from "~/app/_components/reactFlow/BasicNode";
import type { KanbanCard } from "~/lib/types/kanbanTypes";

export const nodeTypes = {
  basic: BasicNode,
};

export interface basicNodeData {
  id: string;
  scrumId: number;
  nodeType: KanbanCard["cardType"];
  title: string;
  showDeleteButton?: boolean;
  onDelete?: () => void;
  showEditButton?: boolean;
  onEdit?: () => void;
  collapsible: boolean;
}
