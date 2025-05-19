"use client";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import React from "react";
import { twMerge } from "tailwind-merge";

export const SampleContributionData = [
  { category: "Tasks", value: 40 },
  { category: "Issues", value: 35 },
  { category: "User Stories", value: 25 },
];

const pieChartSpec: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  description: "Contribution Pie Chart",
  width: 150,
  height: 150,
  autosize: "none",

  data: [
    {
      name: "table",
      values: SampleContributionData,
    },
    {
      name: "pieData",
      source: "table",
      transform: [
        {
          type: "pie",
          field: "value",
          startAngle: 0,
          endAngle: 6.29,
          sort: false,
        },
      ],
    },
  ],

  scales: [
    {
      name: "color",
      type: "ordinal",
      domain: { data: "table", field: "category" },
      range: ["#88BB87", "#15734F", "#13918A"],
    },
  ],

  marks: [
    {
      type: "arc",
      from: { data: "pieData" },
      encode: {
        enter: {
          fill: { scale: "color", field: "category" },
          x: { signal: "width / 2" },
          y: { signal: "height / 2" },
          startAngle: { field: "startAngle" },
          endAngle: { field: "endAngle" },
          innerRadius: { value: 0 },
          outerRadius: { signal: "width / 2" },
          stroke: { value: "white" },
          strokeWidth: { value: 0 },
        },
      },
    },
  ],
};

const PieChartComponent = createClassFromSpec({
  mode: "vega",
  spec: pieChartSpec,
});

type ContributionPieChartProps = {
  data?: typeof SampleContributionData;
  className?: string;
};

export const ContributionPieChart = ({
  data = SampleContributionData,
  className = "",
}: ContributionPieChartProps) => {
  return (
    <div className={twMerge("flex flex-col", className)}>
      <PieChartComponent data={{ table: data }} actions={false} />
    </div>
  );
};

export const ContributionLegend: React.FC<{
  data?: typeof SampleContributionData;
}> = ({ data = SampleContributionData }) => {
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
