"use client";
import React from "react";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import { cn } from "~/lib/helpers/utils";
import { api } from "~/trpc/react";
import { differenceInDays, parseISO } from "date-fns";

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
export function useBurndownData(projectId: string): BurndownData {
  const { data: status, isLoading } = api.projects.getProjectStatus.useQuery({
    projectId,
  });

  // Calculate sprint dates directly from status
  const sprintDates = React.useMemo(() => {
    if (
      !status ||
      isLoading ||
      !status.currentSprintStartDate ||
      !status.currentSprintEndDate
    ) {
      return null;
    }

    const startDate =
      typeof status.currentSprintStartDate === "string"
        ? status.currentSprintStartDate
        : status.currentSprintStartDate.toISOString();
    
    // Only fetch up to today
    const endDate = new Date().toISOString(); 

    return { start: startDate, end: endDate };
  }, [status, isLoading]);

  // Fetch historical data
  const { data: burndownHistory } = api.tasks.getSprintBurndownHistory.useQuery(
    {
      projectId,
      startDate: sprintDates?.start ?? "",
      endDate: sprintDates?.end ?? "",
    },
    {
      enabled: !!sprintDates,
    },
  );

  return React.useMemo(() => {
    if (!status || isLoading) return SampleBurndownData;

    // Check if we have sprint data
    if (!status.currentSprintStartDate || !status.currentSprintEndDate) {
      return SampleBurndownData; // Use sample data if no sprint is defined
    }

    const startDate =
      typeof status.currentSprintStartDate === "string"
        ? parseISO(status.currentSprintStartDate)
        : new Date(status.currentSprintStartDate);

    const endDate =
      typeof status.currentSprintEndDate === "string"
        ? parseISO(status.currentSprintEndDate)
        : new Date(status.currentSprintEndDate);

    // Calculate sprint duration in days
    const sprintDuration = differenceInDays(endDate, startDate) + 1;
    const today = new Date();
    const currentDay = Math.min(
      differenceInDays(today, startDate),
      sprintDuration - 1,
    );

    // Total tasks/story points to complete
    const totalTasks = status.taskCount;
    const completedTasks = status.completedCount;
    const remainingTasks = totalTasks - completedTasks;

    // Create ideal burndown line (unchanged)
    const idealBurndown: BurndownData = [];
    for (let day = 0; day < sprintDuration; day++) {
      const idealRemaining = totalTasks * (1 - day / (sprintDuration - 1));
      idealBurndown.push({
        x: day,
        y: idealRemaining,
        c: 0, // 0 for ideal line
      });
    }

    // Create actual burndown line using historical data
    const actualBurndown: BurndownData = [];

    if (burndownHistory && burndownHistory.length > 0) {
      // Sort historical data by day to ensure correct line drawing
      const sortedHistory = [...burndownHistory].sort((a, b) => a.day - b.day);
      // Use actual historical data
      sortedHistory.forEach((data: BurndownDataPoint) => {
        if (data === undefined || typeof data.completedCount !== "number") {
          console.warn("Invalid data point:", data);
          return;
        }

        const remaining = totalTasks - data.completedCount;

        actualBurndown.push({
          x: data.day,
          y: remaining,
          c: 1,
        });
      });
    }

    // For the current day, use the actual remaining count
    if (actualBurndown.length > 0) {
      actualBurndown[actualBurndown.length - 1] = {
        x: currentDay,
        y: remainingTasks,
        c: 1,
      };
    }

    // Combine both lines
    return [...idealBurndown, ...actualBurndown];
  }, [status, isLoading, projectId, burndownHistory]);
}

// Define the data type for burndown chart
export type BurndownData = Array<{
  x: number;
  y: number;
  c: number;
}>;

// The data from the x need to be the total days of the sprint
// The data from the y need to be the total story points
export type BurndownDataPoint = {
  day: number;
  completedCount: number;
  date?: string;
};

// Sample burndown data for initial rendering
const SampleBurndownData: BurndownData = [{ x: 0, y: 0, c: 0 }];

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
    },
  ],

  data: [
    {
      name: "table",
      values: SampleBurndownData,
    },
  ],

  scales: [
    {
      name: "x",
      type: "point",
      range: "width",
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
      range: [" #8BC48A", "#13918A"],
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
  ],
};

const BurndownChart: React.FC<{
  projectId: string;
  className?: string;
}> = ({ projectId, className = "" }) => {
  // Use the data generation hook
  const burndownData = useBurndownData(projectId);

  // Calculate appropriate domain based on data
  const maxY = React.useMemo(() => {
    if (!burndownData.length) return 100;
    return Math.max(...burndownData.map((d) => d.y));
  }, [burndownData]);

  const domain: [number, number] = [0, maxY];

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
    const specCopy = JSON.parse(JSON.stringify(burndownSpec)) as VegaSpec;

    // Update the data values
    if (specCopy.data && Array.isArray(specCopy.data)) {
      const tableData = specCopy.data.find((d) => d.name === "table");
      if (tableData) {
        // Use type assertion to safely set the values
        (tableData as { values?: BurndownData }).values = burndownData;
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

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto flex h-full max-h-64 w-full flex-col rounded-lg p-4 pb-0 pt-0",
        className,
      )}
    >
      <div>
        <h3 className="text-lg font-bold">Burndown Chart</h3>
      </div>
      {containerDimensions.width > 0 && containerDimensions.height > 0 && (
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
              <span className="text-sm font-semibold text-gray-600">
                Actual
              </span>
            </div>
          </div>
          <LineChartComponent actions={false} />
        </>
      )}
    </div>
  );
};

export default BurndownChart;
