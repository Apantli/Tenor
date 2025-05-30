"use client";
import React from "react";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import { cn } from "~/lib/helpers/utils";

// Define the data type for burndown chart
export type BurndownData = Array<{
  x: number;
  y: number;
  c: number; // 0 for ideal, 1 for actual
}>;

// Sample data
export const SampleBurndownData: BurndownData = [
  {"x": 0, "y": 28, "c": 0}, {"x": 0, "y": 20, "c": 1},
  {"x": 1, "y": 43, "c": 0}, {"x": 1, "y": 35, "c": 1},
  {"x": 2, "y": 81, "c": 0}, {"x": 2, "y": 10, "c": 1},
  {"x": 3, "y": 19, "c": 0}, {"x": 3, "y": 15, "c": 1},
  {"x": 4, "y": 52, "c": 0}, {"x": 4, "y": 48, "c": 1},
  {"x": 5, "y": 24, "c": 0}, {"x": 5, "y": 28, "c": 1},
  {"x": 6, "y": 87, "c": 0}, {"x": 6, "y": 66, "c": 1},
  {"x": 7, "y": 17, "c": 0}, {"x": 7, "y": 27, "c": 1},
  {"x": 8, "y": 68, "c": 0}, {"x": 8, "y": 16, "c": 1},
  {"x": 9, "y": 49, "c": 0}, {"x": 9, "y": 25, "c": 1}
];

// Base Vega specification for burndown chart
const burndownSpec: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  description: "Sprint burndown chart",
  width: 450,
  height: 220,
  autosize: {
    type: "fit",
    contains: "padding",
  },
  padding: { right: 20, left: 10, top: 10, bottom: 10 },

  signals: [
    {
      name: "interpolate",
      value: "linear"
    }
  ],

  data: [
    {
      name: "table",
      values: SampleBurndownData
    }
  ],

  scales: [
    {
      name: "x",
      type: "point",
      range: "width",
      domain: { data: "table", field: "x" }
    },
    {
      name: "y",
      type: "linear",
      range: "height",
      nice: true,
      zero: true,
      domain: { data: "table", field: "y" }
    },
    {
      name: "color",
      type: "ordinal",
      range: ["#13918A", "#8BC48A"],
      domain: { data: "table", field: "c" }
    }
  ],

  axes: [
    {
      orient: "bottom",
      scale: "x",
      labelFontWeight: 600,
      labelFontSize: 12,
      labelFont: "GeistSans, GeistSans Fallback, ui-sans-serif",
      labelColor: "#6B7280",
      title: "Sprint Day",
      grid: true,
      gridOpacity: 0.1,
    },
    {
      orient: "left",
      scale: "y",
      labelPadding: 8,
      zindex: 1,
      grid: true,
      gridOpacity: 0.1,
      title: "Story Points",
      titleFontSize: 14,
      titleFontWeight: 600,
      titleColor: "#6B7280",
      titlePadding: 10,
      labelFontSize: 12,
      labelFont: "GeistSans, GeistSans Fallback, ui-sans-serif",
      labelColor: "#6B7280",
      labelFontWeight: 600,
    }
  ],

  marks: [
    {
      type: "group",
      from: {
        facet: {
          name: "series",
          data: "table",
          groupby: "c"
        }
      },
      marks: [
        {
          type: "line",
          from: { data: "series" },
          encode: {
            enter: {
              x: { scale: "x", field: "x" },
              y: { scale: "y", field: "y" },
              stroke: { scale: "color", field: "c" },
              strokeWidth: { value: 3 }
            },
            update: {
              interpolate: { signal: "interpolate" },
              strokeOpacity: { value: 1 }
            },
            hover: {
              strokeOpacity: { value: 0.7 }
            }
          }
        },
        {
          type: "symbol",
          from: { data: "series" },
          encode: {
            enter: {
              x: { scale: "x", field: "x" },
              y: { scale: "y", field: "y" },
              fill: { scale: "color", field: "c" },
              size: { value: 50 }
            }
          }
        }
      ]
    }
  ]
};

interface BurndownChartProps {
  data?: BurndownData;
  className?: string;
  domain?: [number, number];
}

const BurndownChart: React.FC<BurndownChartProps> = ({
  data = SampleBurndownData,
  className = "",
  domain,
}) => {
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
        const width = entry.contentRect.width - 20;
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
  const modifiedSpec = React.useMemo(() => {
    const specCopy = JSON.parse(JSON.stringify(burndownSpec));

    // Update the y-scale domain if provided
    if (domain) {
      const yscaleIndex = specCopy.scales.findIndex(
        (scale: any) => scale.name === "y"
      );
      if (yscaleIndex !== -1 && specCopy.scales[yscaleIndex]) {
        specCopy.scales[yscaleIndex].domain = domain;
      }
    }

    // Update dimensions if container has been measured
    if (containerDimensions.width > 0) {
      specCopy.width = containerDimensions.width;
      specCopy.height = containerDimensions.height;
    }

    return specCopy;
  }, [domain, containerDimensions]);

  // Create the component with the modified spec
  const LineChartComponent = React.useMemo(
    () =>
      createClassFromSpec({
        mode: "vega",
        spec: modifiedSpec,
      }),
    [modifiedSpec]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto flex h-full w-full flex-col rounded-lg p-4 pb-0 pt-0",
        className
      )}
    >
      {containerDimensions.width > 0 && containerDimensions.height > 0 && (
        <>
          <div className="absolute right-4 top-4 z-10 flex flex-row gap-4">
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-sm"
                style={{ backgroundColor: "#13918A" }}
              />
              <span className="text-sm font-semibold text-gray-600">Ideal</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-sm"
                style={{ backgroundColor: "#8BC48A" }}
              />
              <span className="text-sm font-semibold text-gray-600">
                Actual
              </span>
            </div>
          </div>
          <h3 className="ml-4 mt-2 text-lg font-medium text-gray-700">Sprint Burndown</h3>
          <LineChartComponent data={{ table: data }} actions={false} />
        </>
      )}
    </div>
  );
};

export default BurndownChart;








