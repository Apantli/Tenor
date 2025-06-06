import React from "react";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import { cn } from "~/lib/helpers/utils";
import HelpIcon from "@mui/icons-material/Help";

const spec1: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  description: "Line chart to see team performance.",
  width: 300,
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
          // tooltip: {
          //   signal: "{'Date': timeFormat(datum.x, '%B %d, %Y'), 'Contribution Count': datum.y}"
          // },
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
          size: { value: 100 },
          fill: { value: "#1a6e44" },
          fillOpacity: { value: 1 },
          stroke: { value: "#ffffff" },
          strokeWidth: { value: 2 },
          tooltip: {
            signal:
              "{'Date:':trim(timeFormat(datum.x, '%B %d, %Y')), 'Contributions:':datum.y}",
          },
        },
        update: {
          size: { value: 100 },
        },
        hover: {
          size: { value: 150 },
          fillOpacity: { value: 0.8 },
        },
      },
    },
  ],
};

type PerformanceChartProps = {
  data?: typeof SamplePerformanceData | undefined;
  className?: string;
  showLabel?: boolean;
};

export const PerformanceChart = ({
  data = SamplePerformanceData,
  className = "",
  showLabel = false,
}: PerformanceChartProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = React.useState({
    width: 0,
    height: 0,
  });

  console.log("PerformanceChart rendered with data:", data);
  // Resize graph on container dimension changes
  React.useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width * 0.8;
        const height = entry.contentRect.height - 50;
        setContainerDimensions({
          width: Math.max(width, 0),
          height: Math.min(Math.max(height, 100), 150),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Modify spec with dynamic width, height, and axes
  const modifiedSpec = React.useMemo(() => {
    const specCopy = structuredClone(spec1);

    // Update dimensions if container has been measured
    if (containerDimensions.width > 0) {
      specCopy.width = containerDimensions.width;
      specCopy.height = containerDimensions.height;
    }

    // Add axes if showLabel is true
    if (showLabel) {
      // Extract unique x values from data for axis ticks
      const xValues = data ? data.map((d) => d.x.getTime()) : [];

      specCopy.axes = [
        {
          orient: "bottom",
          scale: "x",
          title: "Date",
          labelAngle: 0,
          titlePadding: 10,
          format: "%b %d",
          values: xValues,
        },
        {
          orient: "left",
          scale: "y",
          title: "Contribution Count",
          titlePadding: 10,
          tickCount: 5,
          tickSize: 0,
        },
      ];
    }

    return specCopy;
  }, [containerDimensions, showLabel, data]);

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
        "group relative mr-auto flex h-full w-full flex-col rounded-lg p-4 pb-0 pt-0",
        className,
      )}
    >
      {containerDimensions.width > 0 && containerDimensions.height > 0 && (
        <PerformanceChart
          data={{ table: data }}
          actions={false}
          tooltip={true}
        />
      )}
      {data.length > 0 && (
        <HelpIcon
          className="absolute right-3 text-gray-500 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
          data-tooltip-id="tooltip"
          data-tooltip-content="A contribution occurs when a team member creates or updates a backlog item, task, epic, sprint, requirement or project."
          data-tooltip-place="top-start"
          style={{ width: "30px" }}
        />
      )}
    </div>
  );
};

export const SamplePerformanceData = [
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
];
