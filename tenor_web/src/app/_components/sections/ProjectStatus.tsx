import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import {
  StatusBarChart,
  type ProjectStatusData,
} from "~/app/_components/charts/ProjectStatusChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAlert } from "~/app/_hooks/useAlert";
import { timestampToDate } from "~/utils/helpers/parsers";
import { cn } from "~/lib/utils";
export const ProjectStatus = ({ className }: { className?: string }) => {
  const { data, isLoading } = api.projects.getTopProjectStatus.useQuery({
    count: 4,
  });
  const utils = api.useUtils();
  const { alert } = useAlert();

  const { mutateAsync: recomputeTopProjectStatus, isPending } =
    api.projects.recomputeTopProjectStatus.useMutation({
      onSuccess: async () => {
        alert("Success", "Project status has been reloaded.", {
          type: "success",
          duration: 5000,
        });
        await utils.projects.getTopProjectStatus.invalidate();
      },
      onError: async (error) => {
        alert("Alert", error.message, {
          type: "warning",
          duration: 5000,
        });
      },
    });

  const barCharData: ProjectStatusData = [];

  data?.topProjects.forEach((project) => {
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

  const maxTasks = Math.max(...barCharData.map((item) => item.value), 0);

  const domainMax = maxTasks + 5;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-start justify-start rounded-md border-2 p-4",
        className,
      )}
    >
      {/* FIXME: standarize margin in cards */}
      <h2 className="mb-3 ml-6 text-2xl font-semibold">Project status</h2>

      {isLoading ? (
        <div className="flex flex-row gap-3 align-middle">
          <LoadingSpinner />
          <p className="text-lg font-semibold">Loading project status...</p>
        </div>
      ) : (
        <>
          {data?.topProjects.length === 0 || maxTasks === 0 ? (
            <div className="mx-auto my-auto flex flex-col items-center">
              <span className="mx-auto text-[100px] text-gray-500">
                <BarChartIcon fontSize="inherit" />
              </span>
              <h1 className="mb-5 text-xl font-semibold text-gray-500">
                No projects contain an active sprint with assigned tasks
              </h1>
            </div>
          ) : (
            <StatusBarChart data={barCharData} domain={[0, domainMax]} />
          )}

          <div className="mx-auto mt-auto flex flex-row gap-2 text-gray-500">
            {!isPending && (
              <RefreshIcon
                data-tooltip-id="tooltip"
                data-tooltip-content="Refetch project status"
                data-tooltip-place="top-start"
                onClick={async () => {
                  await recomputeTopProjectStatus({
                    count: 4,
                  });
                }}
                className=""
              />
            )}
            {isPending || !data?.fetchDate ? (
              <>
                <LoadingSpinner />
                <p>Refreshing project status...</p>
              </>
            ) : (
              <p>Updated {timestampToDate(data.fetchDate).toLocaleString()}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
