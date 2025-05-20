import { createClassFromSpec, type VisualizationSpec } from "react-vega";

const spec1: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  description: "Line chart to see team performance.",
  width: 500,
  height: 70,
  padding: 5,

  data: [
    {
      name: "table",
    },
  ],
  scales: [
    {
      name: "x",
      type: "point",
      range: "width",
      domain: { data: "table", field: "x" },
    },
    {
      name: "y",
      type: "linear",
      range: "height",
      nice: true,
      zero: true,
      domain: { data: "table", field: "y" },
    },
  ],

  marks: [
    {
      type: "area",
      from: { data: "table" },
      encode: {
        enter: {
          x: { scale: "x", field: "x" },
          y: { scale: "y", field: "y" },
          y2: { scale: "y", value: 0 },
          fill: { value: "#1a6e44" },
        },
        update: {
          interpolate: { value: "basis" },
          fillOpacity: { value: 0.2 },
        },
      },
    },
    {
      type: "line",
      from: { data: "table" },
      encode: {
        enter: {
          x: { scale: "x", field: "x" },
          y: { scale: "y", field: "y" },
          stroke: { value: "#1a6e44" },
          strokeWidth: { value: 3 },
        },
        update: {
          interpolate: { value: "basis" },
        },
      },
    },
    {
      name: "points",
      type: "symbol",
      from: { data: "table" },
      encode: {
        enter: {
          x: { scale: "x", field: "x" },
          y: { scale: "y", field: "y" },
          size: { value: 400 },
          fillOpacity: { value: 0 },
        },
      },
    },
  ],
};

export const PerformanceChart = createClassFromSpec({
  mode: "vega",
  spec: spec1,
});

export const SampleData = {
  table: [
    { x: 0, y: 0 },
    { x: 1, y: 43.1231 },
    { x: 2, y: 81 },
    { x: 3, y: 19 },
    { x: 4, y: 52 },
    { x: 5, y: 24 },
    { x: 6, y: 87 },
    { x: 7, y: 17 },
    { x: 8, y: 68 },
    { x: 9, y: 49 },
  ],
};
