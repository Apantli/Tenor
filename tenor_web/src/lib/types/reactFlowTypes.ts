import BasicNode from "~/app/_components/reactFlow/BasicNode";

export const nodeTypes = {
  basic: BasicNode,
};

export interface BasicNodeData {
  scrumId: number;
  itemType: "US" | "EP" | "TS";
  title: string;
  showDeleteButton?: boolean;
  showEditButton?: boolean;
  collapsible: boolean;
  parentId?: string; // Only for tasks
}
