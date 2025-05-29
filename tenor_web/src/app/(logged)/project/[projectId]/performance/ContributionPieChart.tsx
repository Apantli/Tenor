"use client";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import React from "react";
import { cn } from "~/lib/utils";

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

type ContributionPieChartProps = {
  data?: typeof SampleContributionData;
  className?: string;
};

export const ContributionPieChart = ({
  data = SampleContributionData,
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
        const width = entry.contentRect.width * 0.6;
        const height = entry.contentRect.height;

        console.log(`Container resized: width=${width}, height=${height}`);
        setContainerDimensions({
          width: Math.min(Math.max(width, 50), 200),
          height: Math.min(Math.max(width, 50), 200),
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
      specCopy.width = size;
      specCopy.height = size;
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

export const ContributionLegend: React.FC<{
  data?: typeof SampleContributionData;
}> = ({ data = SampleContributionData }) => {
  const colorMap: Record<string, string> = {
    Tasks: "#88BB87",
    Issues: "#15734F",
    "User Stories": "#13918A",
  };

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="ml-4 flex flex-col gap-2">
      {data.map((item) => (
        <div key={item.category} className="flex items-center gap-5">
          <div
            className="h-4 min-h-4 w-4 min-w-4 rounded-sm"
            style={{ backgroundColor: colorMap[item.category] }}
          />
          <span className="text-sm">{item.category}</span>
          <span className="ml-auto text-sm text-gray-500">
            {parseFloat(
              ((item.value / totalValue) * 100).toFixed(2),
            ).toString()}
            %
          </span>
        </div>
      ))}
    </div>
  );
};
