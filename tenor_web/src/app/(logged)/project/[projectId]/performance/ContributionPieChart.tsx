"use client";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import React from "react";
import { cn } from "~/lib/helpers/utils";

export const SampleContributionData = [
  { category: "Tasks", value: 40 },
  { category: "Issues", value: 35 },
  { category: "User Stories", value: 25 },
];

export type SampleContributionDataType = typeof SampleContributionData;

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
      range: ["#88BB87", "#15734F", "#13918A", "#D1D5DB"],
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

type ContributionPieChartProps = {
  data?: typeof SampleContributionData;
  className?: string;
  scaleFactor?: number;
};

export const ContributionPieChart = ({
  data = SampleContributionData,
  scaleFactor = 1,
  className = "",
}: ContributionPieChartProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = React.useState({
    width: 0,
    height: 0,
  });

  // Resize graph on container dimension changes
  React.useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;

        setContainerDimensions({
          width: Math.min(Math.max(width, 50), 400),
          height: Math.min(Math.max(width, 50), 400),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Modify spec with dynamic width, height and color
  const modifiedSpec = React.useMemo(() => {
    const specCopy = structuredClone(pieChartSpec);

    // Update dimensions if container has been measured
    if (containerDimensions.width > 0) {
      const size = Math.min(
        containerDimensions.width,
        containerDimensions.height,
      );
      specCopy.width = size * scaleFactor;
      specCopy.height = size * scaleFactor;
    }

    return specCopy;
  }, [containerDimensions]);

  // Create the component with the modified spec
  const ContributionPieChart = React.useMemo(
    () =>
      createClassFromSpec({
        mode: "vega",
        spec: modifiedSpec,
      }),
    [modifiedSpec],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "mr-auto flex h-full w-full flex-col items-center rounded-lg p-4 pb-0 pt-0",
        className,
      )}
    >
      {containerDimensions.width > 0 && containerDimensions.height > 0 && (
        <ContributionPieChart data={{ table: data }} actions={false} />
      )}
    </div>
  );
};
