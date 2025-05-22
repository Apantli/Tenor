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

export const ProjectStatus = () => {
  const { data, isLoading } = api.projects.getTopProjectStatus.useQuery({
    count: 4,
  });
  const utils = api.useUtils();
  const { alert } = useAlert();

  const { mutateAsync: recomputeTopProjectStatus, isPending } =
    api.projects.recomputeTopProjectStatus.useMutation({
      onSuccess: async () => {
        alert("Success", "Project status has been refetched.", {
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
      category: project.name ?? "Sin nombre",
      position: "Finished",
      value: project.completedCount,
    });
    barCharData.push({
      category: project.name ?? "Sin nombre",
      position: "Expected",
      value: project.taskCount,
    });
  });

  const domainMax = Math.max(...barCharData.map((item) => item.value), 0) + 5;

  return (
    <div className="flex h-full w-full flex-col items-start justify-start rounded-md border-2 p-4">
      <h2 className="mb-3 text-2xl font-semibold">Project status</h2>

      {isLoading ? (
        <div className="flex flex-row gap-3 align-middle">
          <LoadingSpinner />
          <p className="text-lg font-semibold">Loading project status...</p>
        </div>
      ) : (
        <>
          {data?.topProjects.length === 0 ? (
            <div className="mx-auto flex flex-col items-center">
              <p className="text-lg italic text-gray-500"></p>
              <span className="mx-auto -mb-10 text-[200px] text-gray-500">
                <BarChartIcon fontSize="inherit" />
              </span>
              <h1 className="mb-5 text-3xl font-semibold text-gray-500">
                No projects with active sprint found
              </h1>
            </div>
          ) : (
            <StatusBarChart data={barCharData} domain={[0, domainMax]} />
          )}

          <div className="mx-auto flex flex-row gap-2 text-gray-500">
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
