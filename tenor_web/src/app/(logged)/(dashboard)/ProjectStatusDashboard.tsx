"use client";

import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import type { ProjectStatusData } from "~/app/(logged)/(dashboard)/ProjectStatusChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAlert } from "~/app/_hooks/useAlert";
import { timestampToDate } from "~/lib/helpers/parsers";
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
  // #region Hooks
  const utils = api.useUtils();
  const { predefinedAlerts, alertTemplates } = useAlert();
  // #endregion

  // #region TRPC
  const { mutateAsync: recomputeTopProjectStatus, isPending } =
    api.projects.recomputeTopProjectStatus.useMutation({
      onSuccess: async () => {
        predefinedAlerts.statusUpdateSuccess();
        await utils.projects.getTopProjectStatus.invalidate();
      },
      onError: async (error) => {
        alertTemplates.warning(error.message);
      },
      retry: 0,
    });
  const { data, isLoading, isError } =
    api.projects.getTopProjectStatus.useQuery({
      count: 4,
    });
  // #endregion

  // #region UTILITY

  const barCharData: ProjectStatusData = [];

  if (data) {
    data.topProjects.forEach((project) => {
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
        <h2 className="w-full self-center text-xl gap-1 font-semibold">Project status</h2>
      {isLoading ? (
        <div className="mx-auto my-auto flex flex-col items-center">
          <span className="mx-auto text-[100px] text-gray-500">
            <LoadingSpinner color="primary" />
          </span>
        </div>
      ) : isError ||
        !data ||
        data?.topProjects.length === 0 ||
        maxTasks === 0 ? (
        <div className="mx-auto my-auto flex flex-col items-center">
          <span className="mx-auto text-[100px] text-gray-500">
            <BarChartIcon fontSize="inherit" />
          </span>
          <h1 className="mb-5 text-xl font-semibold text-gray-500 text-center">
            No projects contain an active sprint with assigned tasks
          </h1>
        </div>
      ) : (
        <DynamicStatusBarChart data={barCharData} domain={[0, domainMax]} />
        
      )}
      <div className="mx-auto mt-auto flex flex-row gap-2 text-gray-500">
        {!isPending && !isLoading && (
          <>
            <RefreshIcon
              data-tooltip-id="tooltip"
              data-tooltip-content="Refetch project status"
              data-tooltip-place="top-start"
              onClick={async () => {
                await recomputeTopProjectStatus({
                  count: 4,
                });
              }}
              className="cursor-pointer"
            />
            {data?.fetchDate ? (
              <p>Updated {timestampToDate(data.fetchDate).toLocaleString()}</p>
            ) : (
              <p>Updated {new Date().toLocaleString()}</p>
            )}
          </>
        )}
        {isPending && ( // Also show loading text on initial load
          <>
            <LoadingSpinner />
            <p>Refreshing project status...</p>
          </>
        )}
      </div>
    </div>
  );
};
