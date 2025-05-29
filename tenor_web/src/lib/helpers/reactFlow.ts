import Dagre from "@dagrejs/dagre";
import { type Edge, type Node } from "@xyflow/react";

/**
 * @function getLayoutedElements
 * @description Arranges nodes and edges in a left-to-right layout using Dagre graph layout algorithm.
 * @param {Node[]} nodes - The nodes to arrange in the graph.
 * @param {Edge[]} edges - The edges connecting the nodes.
 * @param {boolean} considerLabelSpace - Whether to add extra spacing for labels.
 * @returns {Object} An object containing the arranged nodes and edges.
 */
export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  considerLabelSpace = false,
) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  // Dagre uses a top to bottom (TB) layout by default, we want to use a left to right (LR) layout
  g.setGraph({ rankdir: "LR" });

  // Assigning the data we have to the Dagre graph
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    }),
  );

  Dagre.layout(g);

  // Add a multiplier to the x position to account for the label space
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

/**
 * @function saveFlowToLocalStorage
 * @description Saves the current flow state to localStorage for persistence. For example, when the user refreshes the page, the nodes they moved and their positions will be maintained.
 * @param {string} projectId - The ID of the project to save the flow for.
 * @param {Object} flow - The flow state to save.
 * @param {Node[]} flow.nodes - The nodes in the flow.
 * @param {Edge[]} flow.edges - The edges in the flow.
 * @param {Object} flow.viewport - The viewport state of the flow.
 */
export const saveFlowToLocalStorage = (
  projectId: string,
  flowIdentifier: string,
  flow: {
    nodes: Node[];
    edges: Edge[];
    viewport: { x: number; y: number; zoom: number };
  },
) => {
  localStorage.setItem(
    `flow:${flowIdentifier}:${projectId}`,
    JSON.stringify(flow),
  );
};

/**
 * @function loadFlowFromLocalStorage
 * @description Loads a previously saved flow state from localStorage.
 * @param {string} projectId - The ID of the project to load the flow for.
 * @returns {Object|null} The saved flow state if it exists, null otherwise.
 */
export const loadFlowFromLocalStorage = (
  projectId: string,
  flowIdentifier: string,
) => {
  const flowString = localStorage.getItem(
    `flow:${flowIdentifier}:${projectId}`,
  );
  if (!flowString) return null;
  return JSON.parse(flowString) as {
    nodes: Node[];
    edges: Edge[];
    viewport: { x: number; y: number; zoom: number };
  };
};
