import { createClassFromSpec, type VisualizationSpec } from "react-vega";

const spec1: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  description: "Line chart to see team performance.",
  width: 500,
  height: 100,
  padding: 5,

  data: [
    {
      name: "table",
    },
  ],
  scales: [
    {
      name: "x",
      type: "time",
      range: "width",
      domain: { data: "table", field: "x" },
      nice: true,
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

  // axes: [
  //   {
  //     orient: "bottom",
  //     scale: "x",
  //     labelAngle: -45,
  //     format: "%b %d",
  //     tickCount: 5,
  //   },
  //   {
  //     orient: "left",
  //     scale: "y",
  //     grid: true,
  //   },
  // ],

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
    { x: new Date("2025-05-01"), y: 20 },
    { x: new Date("2025-05-02"), y: 43.1231 },
    { x: new Date("2025-05-03"), y: 81 },
    { x: new Date("2025-05-04"), y: 19 },
    { x: new Date("2025-05-05"), y: 52 },
    { x: new Date("2025-05-06"), y: 24 },
    { x: new Date("2025-05-07"), y: 87 },
    { x: new Date("2025-05-08"), y: 17 },
    { x: new Date("2025-05-09"), y: 68 },
    { x: new Date("2025-05-10"), y: 49 },
  ],
};
