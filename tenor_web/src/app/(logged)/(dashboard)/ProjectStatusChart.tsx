"use client";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import React from "react";
import { cn } from "~/lib/helpers/utils";

interface VegaScale {
  name: string;
  type: string;
  domain: number[] | string[] | { data: string; field: string };
  range?: string;
  padding?: number;
  paddingOuter?: number;
  round?: boolean;
  zero?: boolean;
  nice?: boolean;
}

type ExtendedSpec = VisualizationSpec & {
  scales: VegaScale[];
  width: number;
  height: number;
};

export type ProjectStatusData = Array<{
  category: string;
  position: "Finished" | "Expected";
  value: number;
}>;

export const SampleProjectStatus: ProjectStatusData = [
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
  width: 450, // Default width that will be overridden
  height: 220, // Default height that will be overridden
  autosize: {
    type: "fit",
    contains: "padding",
  },
  padding: { right: 10, left: 10 },

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
      labelPadding: 8,
      zindex: 1,
      grid: true,
      gridOpacity: 0.1,
      // Title
      title: "Tasks Completed",
      titleFontSize: 18,
      titleFontWeight: 600,
      titleColor: "#6B7280",
      titlePadding: 10,
      // Label
      labelFontSize: 14,
      labelFont: "GeistSans, GeistSans Fallback, ui-sans-serif",
      labelColor: "#6B7280",
      labelFontWeight: 600,
      // Ticks
      tickCount: 5,
      tickSize: 5,
      tickColor: "#6B7280",
      titleFont: "GeistSans, GeistSans Fallback, ui-sans-serif",
    },
    {
      orient: "bottom",
      scale: "xscale",
      labelFontWeight: 600,
      labelAngle: 0,
      labelAlign: "center",
      labelFontSize: 18,
      labelFont: "GeistSans, GeistSans Fallback, ui-sans-serif",
      labelColor: "#6B7280",
      tickSize: 9,
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

  legends: [],

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
      ],
    },
  ],
};

type StatusBarChartProps = {
  data?: typeof SampleProjectStatus;
  className?: string;
  domain?: [number, number];
};

export const StatusBarChart = ({
  data = SampleProjectStatus,
  className = "",
  domain = [0, 60],
}: StatusBarChartProps) => {
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
        // Subtract padding of chart area
        const width = entry.contentRect.width - 20; // (10px on each side)
        // Account for legend and padding
        const height = Math.max(entry.contentRect.height - 15, 200);

        setContainerDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 150),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Modify spec with dynamic width, height and domain
  const modifiedSpec = React.useMemo<ExtendedSpec>(() => {
    const specCopy = JSON.parse(JSON.stringify(projectStatus)) as ExtendedSpec;

    // Update the y-scale domain
    const yscaleIndex = specCopy.scales.findIndex(
      (scale: VegaScale) => scale.name === "yscale",
    );
    if (yscaleIndex !== -1 && specCopy.scales[yscaleIndex]) {
      specCopy.scales[yscaleIndex].domain = domain;
    }

    // Update dimensions if container has been measured
    if (containerDimensions.width > 0) {
      specCopy.width = containerDimensions.width;
      specCopy.height = containerDimensions.height;
    }

    return specCopy;
  }, [domain, containerDimensions]);

  // Create the component with the modified spec
  const BarChartComponent = React.useMemo(
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
        "relative mx-auto flex h-full w-full flex-col rounded-lg p-4 pb-0 pt-0",
        className,
      )}
    >
      {containerDimensions.width > 0 && containerDimensions.height > 0 && (
        <>
          <div className="absolute right-4 top-4 z-10 flex flex-row gap-4">
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-sm"
                style={{ backgroundColor: "#8BC48A" }}
              />
              <span className="font-semibold text-gray-600">Finished</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-sm"
                style={{ backgroundColor: "#13918A" }}
              />
              <span className="text-sm font-semibold text-gray-600">
                Expected
              </span>
            </div>
          </div>
          <BarChartComponent data={{ table: data }} actions={false} />
        </>
      )}
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
