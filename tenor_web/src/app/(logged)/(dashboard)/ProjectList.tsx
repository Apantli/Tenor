"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEventHandler } from "react";
import SearchBar from "~/app/_components/inputs/search/SearchBar";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import { cn } from "~/lib/helpers/utils";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  projectId: string | null;
  setProjectId: (projectId: string | null) => void;
}

export default function ProjectList({ projectId, setProjectId }: Props) {
  const { data: projects, isLoading } = api.projects.listProjects.useQuery();
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>(
    {},
  );

  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
  };
  const handleOpenProject = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };
  const handleCreateProject = async () => {
    router.push("/create-project");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  const filteredProjects = projects?.filter((project) => {
    return project.name.toLowerCase().includes(searchValue.toLowerCase());
  });

  return (
    <div className="h-full lg:mr-10">
      <div className="flex h-full w-full justify-between gap-x-3 border-b-2 pb-3">
        <SearchBar
          searchValue={searchValue}
          handleUpdateSearch={handleUpdateSearch}
          placeholder="Find a project..."
        />
        <PrimaryButton
          onClick={handleCreateProject}
          data-cy="new-project-button"
        >
          {" "}
          + New project{" "}
        </PrimaryButton>
      </div>
      <ul
        className="h-[calc(100vh-250px)] overflow-hidden overflow-y-auto"
        data-cy="project-list"
      >
        {filteredProjects && filteredProjects?.length > 0 ? (
          filteredProjects?.map((project) => (
            <li
              onClick={() => {
                if (projectId === project.id) {
                  handleOpenProject(project.id);
                } else {
                  setProjectId(project.id);
                }
              }}
              className={cn(
                "flex flex-row justify-start border-b-2 py-[16px] hover:cursor-pointer md:pr-8",
                projectId === project.id && "bg-gray-100 pl-[16px]",
              )}
              key={project.id}
            >
              <div className="flex h-[80px] w-[80px] min-w-[80px] items-center justify-center overflow-hidden rounded-md border-2 bg-white">
                {loadingImages[project.id] !== false && (
                  <div className="flex h-full w-full items-center justify-center">
                    <LoadingSpinner color="primary" />
                  </div>
                )}
                <img
                  className={`h-full w-full rounded-md object-contain p-[4px] ${loadingImages[project.id] !== false ? "hidden" : ""}`}
                  src={
                    project.logo.startsWith("/")
                      ? project.logo
                      : `/api/image_proxy/?url=${encodeURIComponent(
                          project.logo,
                        )}`
                  }
                  alt={project.name}
                  onLoad={() =>
                    setLoadingImages((prev) => ({
                      ...prev,
                      [project.id]: false,
                    }))
                  }
                  onError={() =>
                    setLoadingImages((prev) => ({
                      ...prev,
                      [project.id]: false,
                    }))
                  }
                />
              </div>
              <div className="flex flex-1 flex-col justify-start overflow-hidden pl-4 pr-4">
                <h3 className="my-[7px] truncate text-lg font-semibold md:w-full lg:max-w-[200px]">
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
                  Try changing the search.
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
