import BasicNode from "~/app/_components/reactFlow/BasicNode";
import DependencyEdge from "~/app/_components/reactFlow/DependencyEdge";
import type { TaskDetailType, UserStoryType } from "./firebaseSchemas";

// Node types for react flow
export const nodeTypes = {
  basic: BasicNode,
};

// Edge types for react flow
export const edgeTypes = {
  dependency: DependencyEdge,
};

// The data for the nodes in the dependency tree. This is what the backend needs to know to create the nodes.
export interface BasicNodeData {
  scrumId: number;
  itemType: UserStoryType | TaskDetailType;
  title: string;
  parentId?: string; // Only for tasks
}

// This are the props that are passed to the BasicNode component. This is what the frontend needs to know to display the nodes.
export interface VisualBasicNodeData extends BasicNodeData {
  showDeleteButton?: boolean;
}
