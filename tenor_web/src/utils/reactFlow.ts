import Dagre from "@dagrejs/dagre";
import { type Edge, type Node } from "@xyflow/react";

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  considerLabelSpace = false,
) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR" });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    }),
  );

  Dagre.layout(g);

  const xMultiplier = considerLabelSpace ? 1.2 : 1;

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = (position.x - (node.measured?.width ?? 0) / 2) * xMultiplier;
      const y = position.y - (node.measured?.height ?? 0) / 2;

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

export const saveFlowToLocalStorage = (
  projectId: string,
  flow: {
    nodes: Node[];
    edges: Edge[];
    viewport: { x: number; y: number; zoom: number };
  },
) => {
  localStorage.setItem(`flow:${projectId}`, JSON.stringify(flow));
};

export const loadFlowFromLocalStorage = (projectId: string) => {
  const flowString = localStorage.getItem(`flow:${projectId}`);
  if (!flowString) return null;
  return JSON.parse(flowString) as {
    nodes: Node[];
    edges: Edge[];
    viewport: { x: number; y: number; zoom: number };
  };
};
