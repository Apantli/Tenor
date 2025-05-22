"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEventHandler } from "react";
import SearchBar from "~/app/_components/SearchBar";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import {
  StatusBarChart,
  type ProjectStatusData,
} from "~/app/_components/charts/ProjectStatusChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAlert } from "~/app/_hooks/useAlert";
import { timestampToDate } from "~/utils/helpers/parsers";

export default function ProjectPage() {
  return (
    <div className="flex h-full w-full flex-col items-start lg:flex-row">
      <div className="flex-1 2xl:flex-[2]">
        <h1 className="mb-3 text-3xl font-semibold">Projects</h1>
        <ProjectList />
      </div>
      <div className="flex-1 pt-10 2xl:flex-[2]">
        <ProjectStatus />
        {/* FIXME: Remove when recent activity is ready */}
        <div
          className="mt-2 h-[350px] w-full rounded-md border-2 bg-cover bg-no-repeat"
          style={{ backgroundImage: 'url("/recent_activity_mockup.png")' }}
          aria-label="Dashboard mockup"
        />
      </div>
    </div>
  );
}

const ProjectStatus = () => {
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

const CreateNewProject = () => {
  const router = useRouter();
  const handleCreateProject = async () => {
    router.push("/create-project");
  };

  return (
    <PrimaryButton onClick={handleCreateProject} data-cy="new-project-button">
      {" "}
      + New project{" "}
    </PrimaryButton>
  );
};

function ProjectList() {
  const { data: projects, isLoading } = api.projects.listProjects.useQuery();
  const [searchValue, setSearchValue] = useState("");

  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
  };

  /**
   * * This function is used to open a project when the user clicks on the project image.
   * * This would be something provisional while we are in the development phase.
   */
  const router = useRouter();

  const handleOpenProject = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-row gap-3 align-middle">
        <LoadingSpinner />
        <p className="text-lg font-semibold">Loading your projects...</p>
      </div>
    );
  }

  const filteredProjects = projects?.filter((project) => {
    return project.name.toLowerCase().includes(searchValue.toLowerCase());
  });

  return (
    <div className="mr-10">
      <div className="flex h-full w-full justify-between gap-x-3 border-b-2 pb-3">
        <SearchBar
          searchValue={searchValue}
          handleUpdateSearch={handleUpdateSearch}
          placeholder="Find a project..."
        />
        <CreateNewProject />
      </div>
      <ul
        className="h-[calc(100vh-250px)] w-full overflow-hidden overflow-y-auto"
        data-cy="project-list"
      >
        {filteredProjects && filteredProjects?.length > 0 ? (
          filteredProjects?.map((project) => (
            <li
              className="flex flex-row justify-start border-b-2 py-[16px] pr-8 hover:cursor-pointer"
              key={project.id}
              onClick={() => handleOpenProject(project.id)}
            >
              <div className="h-[80px] w-[80px] min-w-[80px] items-center justify-center overflow-hidden rounded-md border-2 bg-white">
                <img
                  className="h-full w-full rounded-md object-contain p-[4px]"
                  src={
                    project.logo.startsWith("/")
                      ? project.logo
                      : `/api/image_proxy/?url=${encodeURIComponent(project.logo)}`
                  }
                  alt={project.name}
                />
              </div>
              <div className="flex flex-1 flex-col justify-start overflow-hidden pl-4 pr-4">
                <h3 className="my-[7px] max-w-[500px] truncate text-lg font-semibold">
                  {project.name}
                </h3>
                <p className="line-clamp-2 text-base">{project.description}</p>
              </div>
            </li>
          ))
        ) : (
          <li className="flex h-full justify-start border-b-2">
            <div className="py-[20px]">
              <p className="text-gray-500">No projects found.</p>

              {(projects?.length ?? 0) > 0 ? (
                <p className="text-sm text-gray-500">
                  Try changing the search query.
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Try creating a project or ask a project owner to add you to a
                  project.{" "}
                </p>
              )}
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}
