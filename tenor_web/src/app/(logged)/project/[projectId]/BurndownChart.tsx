"use client";
import React from "react";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import { cn } from "~/lib/helpers/utils";
import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import BarChartIcon from "@mui/icons-material/BarChart";
import {
  type BurndownChartData,
  SampleBurndownData,
} from "~/lib/defaultValues/burndownChart";

// Create a more specific type for your Vega specification
type VegaSpec = VisualizationSpec & {
  data?: Array<{
    name: string;
    values?: unknown;
    [key: string]: unknown;
  }>;
  scales?: Array<{
    name: string;
    type?: string;
    domain?: unknown;
    range?: unknown;
    [key: string]: unknown;
  }>;
  width?: number;
  height?: number;
};

// Generates burndown chart data from project status information
export function useBurndownData(projectId: string) {
  const { data, isLoading, isError } = api.projects.getGraphBurndownData.useQuery(
    { projectId },
    { retry: 0, refetchOnWindowFocus: "always", staleTime: 0 }
  );

  return {
    data: data,
    isLoading,
    isError,
  };
}

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
      value: "linear",
    }
  ],

  data: [
    {
      name: "table",
      values: SampleBurndownData,
      transform: [
        {
          type: "formula",
          as: "x",
          expr: "datum.sprintDay",
        },
        {
          type: "formula",
          as: "y",
          expr: "datum.storyPoints",
        },
        {
          type: "formula",
          as: "c",
          expr: "datum.seriesType",
        },
      ],
    },
    {
      name: "lastPoint",
      source: "table",
      transform: [
        {
          type: "filter",
          expr: "datum.c == 1",
        },
        {
          type: "window",
          sort: { field: "x", order: "descending" },
          ops: ["row_number"],
        },
        {
          type: "filter",
          expr: "datum.row_number === 1",
        },
      ],
    },
  ],

  scales: [
    {
      name: "x",
      type: "linear",
      range: "width",
      nice: true,
      zero: true,
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
    {
      name: "color",
      type: "ordinal",
      range: ["#8BC48A", "#13918A"],
      domain: { data: "table", field: "c" },
    },
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
      titleFontSize: 18,
      titleColor: "#6B7280",
      grid: true,
      gridOpacity: 0.1,
      format: "d",
      tickCount: 5,
    },
    {
      orient: "left",
      scale: "y",
      labelPadding: 8,
      zindex: 1,
      grid: true,
      gridOpacity: 0.1,
      title: "Story Points",
      titleFontSize: 18,
      titleColor: "#6B7280",
      titleFontWeight: 600,
      titlePadding: 10,
      labelFontSize: 12,
      labelFont: "GeistSans, GeistSans Fallback, ui-sans-serif",
      labelColor: "#6B7280",
      labelFontWeight: 600,
      format: "d",
      tickCount: 5,
      tickMinStep: 1,
    },
  ],

  marks: [
    {
      type: "group",
      from: {
        facet: {
          name: "series",
          data: "table",
          groupby: "c",
        },
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
              strokeWidth: { value: 3 },
            },
            update: {
              interpolate: { signal: "interpolate" },
              strokeOpacity: { value: 1 },
            },
            hover: {
              strokeOpacity: { value: 0.7 },
            },
          },
        },
        {
          type: "symbol",
          from: { data: "series" },
          encode: {
            enter: {
              x: { scale: "x", field: "x" },
              y: { scale: "y", field: "y" },
              fill: { scale: "color", field: "c" },
              size: { value: 50 },
            },
          },
        },
      ],
    },
    {
      type: "symbol",
      from: { data: "lastPoint" },
      encode: {
        enter: {
          x: { scale: "x", field: "x" },
          y: { scale: "y", field: "y" },
          fill: { value: "#13918A" },
          stroke: { value: "white" },
          strokeWidth: { value: 1 },
          size: { value: 150 },
        },
        update: {
          size: { value: 200 },
          opacity: { value: 1 }
        }
      }
    }
  ],
};

const BurndownChart: React.FC<{
  projectId: string;
  className?: string;
}> = ({ projectId, className = "" }) => {
  // Use the data generation hook
  const { data: burndownData, isLoading, isError } = useBurndownData(projectId);

  // Calculate appropriate domain based on data
  const maxY = React.useMemo(() => {
    if (!burndownData) return 100;
    return Math.max(...burndownData.map((d) => d.storyPoints));
  }, [burndownData]);

  const domain: [number, number] = [0, maxY];

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = React.useState({
    width: 450,
    height: 220,
  });

  // Resize graph on container dimension changes
  React.useEffect(() => {
    if (isLoading || !containerRef.current) return;

    // Force measurement after loading is complete
    const updateDimensions = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const width = rect.width - 20;
        const height = Math.max(rect.height - 15, 220);

        setContainerDimensions({
          width: Math.max(width, 450),
          height: Math.max(height, 220),
        });
      }
    };

    // Run immediately and then set up ResizeObserver
    updateDimensions();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width - 20;
        const height = Math.max(entry.contentRect.height - 15, 220);

        setContainerDimensions({
          width: Math.max(width, 450),
          height: Math.max(height, 220),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isLoading, containerRef]);

  // Modify spec with dynamic width, height and domain
  const modifiedSpec = React.useMemo(() => {
    const specCopy = JSON.parse(JSON.stringify(burndownSpec)) as VegaSpec;

    // Update the data values
    if (specCopy.data && Array.isArray(specCopy.data)) {
      const tableData = specCopy.data.find((d) => d.name === "table");
      if (tableData) {
        // Use type assertion to safely set the values
        (tableData as { values?: BurndownChartData }).values = burndownData;
      }
    }

    // Update the y-scale domain
    if (specCopy.scales && Array.isArray(specCopy.scales)) {
      const yScale = specCopy.scales.find(
        (scale) =>
          typeof scale === "object" && scale !== null && scale.name === "y",
      );

      if (yScale) {
        yScale.domain = domain;
      }
    }

    // Update dimensions if container has been measured
    if (containerDimensions.width > 0) {
      specCopy.width = containerDimensions.width;
      specCopy.height = containerDimensions.height;
    }

    return specCopy;
  }, [domain, containerDimensions, burndownData]);

  // Create the component with the modified spec
  const LineChartComponent = React.useMemo(
    () =>
      createClassFromSpec({
        mode: "vega",
        spec: modifiedSpec,
      }),
    [modifiedSpec],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto flex h-full w-full flex-col rounded-lg pb-0 pt-0",
        className,
      )}
    >
      <div>
        <h3 className="text-xl font-semibold">Burndown Chart</h3>
      </div>
      <>
        <div className="absolute right-4 top-4 z-10 flex flex-row gap-4">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-sm"
              style={{ backgroundColor: "#8BC48A" }}
            />
            <span className="text-sm font-semibold text-gray-600">Ideal</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-sm"
              style={{ backgroundColor: " #13918A" }}
            />
            <span className="text-sm font-semibold text-gray-600">Actual</span>
          </div>
        </div>
        {isLoading ? (
          <div className="mx-auto my-auto flex flex-col items-center">
            <span className="mx-auto text-[100px] text-gray-500">
              <LoadingSpinner color="primary" />
            </span>
          </div>
        ) : isError || !burndownData || domain[1] === 0 ? (
          <div className="mx-auto my-auto flex flex-col items-center">
            <span className="mx-auto text-[100px] text-gray-500">
              <BarChartIcon fontSize="inherit" />
            </span>
            <h1 className="mb-5 text-2xl font-semibold text-gray-500">
              No tasks in current sprint
            </h1>
          </div>
        ) : (
          <div className="h-full">
            <LineChartComponent actions={false} />
          </div>
        )}
      </>
    </div>
  );
};

export default BurndownChart;
