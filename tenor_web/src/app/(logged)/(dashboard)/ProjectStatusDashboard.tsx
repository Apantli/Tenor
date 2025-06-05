"use client";

import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import type { ProjectStatusData } from "~/app/(logged)/(dashboard)/ProjectStatusChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import { cn } from "~/lib/helpers/utils";
import dynamic from "next/dynamic";

const DynamicStatusBarChart = dynamic(
  () =>
    import("~/app/(logged)/(dashboard)/ProjectStatusChart").then(
      (m) => m.StatusBarChart,
    ),
  {
    ssr: false,
  },
);

export const ProjectStatusDashboard = ({
  className,
}: {
  className?: string;
}) => {
  // #region TRPC
  const {
    data: topProjects,
    isLoading,
    isError,
  } = api.projects.getTopProjectStatus.useQuery();
  // #endregion

  // #region UTILITY

  const barCharData: ProjectStatusData = [];

  if (topProjects) {
    topProjects.forEach((project) => {
      barCharData.push({
        category: project.name ?? "No name",
        position: "Finished",
        value: project.completedCount,
      });
      barCharData.push({
        category: project.name ?? "No name",
        position: "Expected",
        value: project.taskCount,
      });
    });
  }

  const maxTasks = Math.max(...barCharData.map((item) => item.value), 0);
  const domainMax = maxTasks + 5;
  // #endregion

  return (
    <div
      className={cn(
        "flex h-[38vh] flex-col overflow-hidden rounded-lg border-2 border-[#BECAD4] p-5",
        className,
      )}
    >
      <h2 className="my-3 ml-2 w-full gap-1 self-center text-xl font-semibold">
        Project status
      </h2>
      {isLoading ? (
        <div className="mx-auto my-auto flex flex-col items-center">
          <span className="mx-auto text-[100px] text-gray-500">
            <LoadingSpinner color="primary" />
          </span>
        </div>
      ) : isError ||
        !topProjects ||
        topProjects.length === 0 ||
        maxTasks === 0 ? (
        <div className="mx-auto my-auto flex flex-col items-center">
          <span className="mx-auto text-[100px] text-gray-500">
            <BarChartIcon fontSize="inherit" />
          </span>
          <h1 className="mb-5 text-center text-xl font-semibold text-gray-500">
            No projects contain an active sprint with assigned tasks
          </h1>
        </div>
      ) : (
        <DynamicStatusBarChart data={barCharData} domain={[0, domainMax]} />
      )}
    </div>
  );
};
