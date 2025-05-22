"use client";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import React from "react";
import { cn } from "~/lib/utils";

export const SampleProjectStatus = [
  { category: "Patch", position: "Finished", value: 28 },
  { category: "Patch", position: "Expected", value: 30 },
  { category: "Echo Trail", position: "Finished", value: 40 },
  { category: "Echo Trail", position: "Expected", value: 35 },
  { category: "FinFlow", position: "Finished", value: 5 },
  { category: "FinFlow", position: "Expected", value: 8 },
  { category: "ThreadSync", position: "Finished", value: 18 },
  { category: "ThreadSync", position: "Expected", value: 17 },
];

const projectStatus: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  description: "Project status bar chart",
  width: 450,
  height: 250,
  autosize: "none",
  padding: { top: 10, right: 10, bottom: 35, left: 55 },
  title: {
    text: "Project status",
    anchor: "start",
    fontSize: 16,
    fontWeight: "bold",
    dy: -10,
  },

  data: [
    {
      name: "table",
      values: SampleProjectStatus,
    },
    {
      name: "legend_data",
      source: "table",
      transform: [
        {
          type: "aggregate",
          groupby: ["position"],
        },
      ],
    },
  ],

  axes: [
    {
      orient: "left",
      scale: "yscale",
      tickSize: 0,
      labelPadding: 8,
      zindex: 1,
      title: "Tickets Completed",
      titleFontSize: 12,
      titleFontWeight: "bold",
      titlePadding: 10,
      labelFontSize: 11,
      grid: true,
      gridOpacity: 0.1,
    },
    {
      orient: "bottom",
      scale: "xscale",
      labelAngle: 0,
      labelAlign: "center",
      labelFontSize: 11,
      tickSize: 0,
      labelPadding: 10,
    },
  ],

  scales: [
    {
      name: "xscale",
      type: "band",
      domain: { data: "table", field: "category" },
      range: "width",
      padding: 0.2,
      paddingOuter: 0.05,
    },
    {
      name: "yscale",
      type: "linear",
      domain: [0, 60],
      range: "height",
      round: true,
      zero: true,
      nice: true,
    },
    {
      name: "color",
      type: "ordinal",
      domain: ["Finished", "Expected"],
      range: ["#8BC48A", "#13918A"],
    },
  ],

  legends: [
    {
      fill: "color",
      orient: "top-right",
      direction: "horizontal",
      symbolType: "square",
      symbolSize: 80,
      labelFontSize: 11,
      padding: 10,
      offset: 5,
    },
  ],

  marks: [
    {
      type: "group",
      from: {
        facet: {
          data: "table",
          name: "facet",
          groupby: "category",
        },
      },
      encode: {
        enter: {
          x: { scale: "xscale", field: "category" },
          width: { scale: "xscale", band: 1 },
        },
      },
      signals: [{ name: "width", update: "bandwidth('xscale')" }],
      scales: [
        {
          name: "pos",
          type: "band",
          range: "width",
          domain: { data: "facet", field: "position" },
          padding: 0.1,
        },
      ],
      marks: [
        {
          name: "bars",
          from: { data: "facet" },
          type: "rect",
          encode: {
            enter: {
              x: { scale: "pos", field: "position" },
              width: { scale: "pos", band: 1 },
              y: { scale: "yscale", field: "value" },
              y2: { scale: "yscale", value: 0 },
              fill: { scale: "color", field: "position" },
              cornerRadius: { value: 2 },
            },
          },
        },
        {
          type: "text",
          from: { data: "bars" },
          encode: {
            enter: {
              y: { field: "y", offset: -5 },
              x: { field: "x", offset: { field: "width", mult: 0.5 } },
              align: { value: "center" },
              baseline: { value: "bottom" },
              text: { signal: "format(datum.value, '0.0f')" },
              fontSize: { value: 10 },
              fontWeight: { value: "normal" },
              fill: { value: "#333333" },
            },
          },
        },
      ],
    },
  ],
};

const BarChartComponent = createClassFromSpec({
  mode: "vega",
  spec: projectStatus,
});

type StatusBarChartProps = {
  data?: typeof SampleProjectStatus;
  className?: string;
};

export const StatusBarChart = ({
  data = SampleProjectStatus,
  className = "",
}: StatusBarChartProps) => {
  return (
    <div className={cn("flex flex-col rounded-lg border p-4", className)}>
      <BarChartComponent data={{ table: data }} actions={false} />
    </div>
  );
};

export const ContributionLegend: React.FC<{
  data?: typeof SampleProjectStatus;
}> = ({ data = SampleProjectStatus }) => {
  const colorMap: Record<string, string> = {
    Tasks: "#88BB87",
    Issues: "#15734F",
    "User Stories": "#13918A",
  };

  return (
    <div className="ml-4 flex flex-col gap-2">
      {data.map((item) => (
        <div key={item.category} className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-sm"
            style={{ backgroundColor: colorMap[item.category] }}
          />
          <span className="text-sm">{item.category}</span>
          <span className="ml-auto text-sm text-gray-500">{item.value}%</span>
        </div>
      ))}
    </div>
  );
};
