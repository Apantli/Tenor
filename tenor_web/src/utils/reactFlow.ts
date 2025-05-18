import Dagre from "@dagrejs/dagre";
import { type Edge, type Node } from "@xyflow/react";

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
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

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = (position.x - (node.measured?.width ?? 0) / 2) * 1.2;
      const y = position.y - (node.measured?.height ?? 0) / 2;

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

export const saveNodePositionsToLocalStorage = (
  projectId: string,
  nodes: Node[],
) => {
  const positions = nodes.reduce(
    (acc, node) => {
      acc[node.id] = { x: node.position.x, y: node.position.y };
      return acc;
    },
    {} as Record<string, { x: number; y: number }>,
  );
  localStorage.setItem(`nodePositions:${projectId}`, JSON.stringify(positions));
};
