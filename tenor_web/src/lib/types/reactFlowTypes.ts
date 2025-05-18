import BasicNode from "~/app/_components/reactFlow/BasicNode";
import DependencyEdge from "~/app/_components/reactFlow/DependencyEdge";

export const nodeTypes = {
  basic: BasicNode,
};

export const edgeTypes = {
  dependency: DependencyEdge,
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
