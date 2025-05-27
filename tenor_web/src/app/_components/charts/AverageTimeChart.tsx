import React from "react";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import { cn } from "~/lib/utils";

const spec1: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  description: "Line chart to see average time per task.",
  width: 250,
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
      type: "linear",
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

  marks: [
    {
      type: "line",

      from: { data: "table" },
      encode: {
        enter: {
          x: { scale: "x", field: "x" },
          y: { scale: "y", field: "y" },
          stroke: { value: "#04CE00" },
          strokeWidth: { value: 5 },
        },
        update: {
          interpolate: { value: "linear" },
        },
      },
    },
  ],
};

type PerformanceChartProps = {
  data?: typeof SamplePerformanceData | undefined;
  className?: string;
  isGreen?: boolean;
};

export const AverageTimeChart = ({
  data = SamplePerformanceData,
  className = "",
  isGreen = true,
}: PerformanceChartProps) => {
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
        const width = entry.contentRect.width - 1000;
        const height = entry.contentRect.height - 50;
        setContainerDimensions({
          width: Math.max(width, 250),
          height: Math.max(height, 50),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Modify spec with dynamic width, height and color
  const modifiedSpec = React.useMemo(() => {
    const specCopy = structuredClone(spec1);

    // Update dimensions if container has been measured
    if (containerDimensions.width > 0) {
      specCopy.width = containerDimensions.width;
      specCopy.height = containerDimensions.height;
    }

    // Update color based on isGreen prop
    const strokeColor = isGreen ? "#04CE00" : "#F87171";
    if (specCopy.marks?.[0]?.encode?.enter) {
      specCopy.marks[0].encode.enter.stroke = { value: strokeColor };
    }

    return specCopy;
  }, [containerDimensions, isGreen]);

  // Create the component with the modified spec
  const PerformanceChart = React.useMemo(
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
        "mr-auto flex h-full w-full flex-col rounded-lg p-4 pb-0 pt-0",
        className,
      )}
    >
      {containerDimensions.width > 0 && containerDimensions.height > 0 && (
        <PerformanceChart data={{ table: data }} actions={false} />
      )}
    </div>
  );
};

export const SamplePerformanceData = [
  { x: 1, y: 10 },
  { x: 2, y: 43.1231 },
  { x: 3, y: 81 },
  { x: 4, y: 19 },
  { x: 5, y: 52 },
];
