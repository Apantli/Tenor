"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEventHandler } from "react";
import SearchBar from "~/app/_components/SearchBar";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import LoadingSpinner from "~/app/_components/LoadingSpinner";

export default function ProjectPage() {
  return (
    <div className="flex h-full w-full flex-row">
      <div className="w-1/2">
        <h1 className="mb-3 text-3xl font-semibold">Projects</h1>
        <ProjectList />
      </div>
      <div className="w-full"></div>
    </div>
  );
}

const CreateNewProject = () => {
  const router = useRouter();
  const handleCreateProject = async () => {
    router.push("/create-project");
  };

  return (
    <PrimaryButton onClick={handleCreateProject}> + New project </PrimaryButton>
  );
};

function ProjectList() {
  const {
    data: projects,
    isLoading,
    error,
  } = api.projects.listProjects.useQuery();
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

  if (error?.data?.code == "UNAUTHORIZED") {
    return <p>Log in to view this information</p>;
  }

  const filteredProjects = projects?.filter((project) => {
    return project.name.toLowerCase().includes(searchValue.toLowerCase());
  });

  return (
    <div className="mr-10">
      <div className="order-b-2 flex h-full w-full justify-between gap-x-3 border-b-2 pb-3">
        <SearchBar
          searchValue={searchValue}
          handleUpdateSearch={handleUpdateSearch}
          placeholder="Find a project..."
        />
        <CreateNewProject />
      </div>
      <ul>
        {filteredProjects && filteredProjects?.length > 0 ? (
          filteredProjects?.map((project) => (
            <li
              className="flex h-full flex-row justify-start border-b-2 py-[16px] hover:cursor-pointer"
              key={project.id}
              onClick={() => handleOpenProject(project.id)}
            >
              <div className="m-[10px] flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-md border-2 bg-white">
                <img
                  className="h-full w-full rounded-md object-contain p-[4px]"
                  src={project.logo}
                  alt={project.name}
                />
              </div>
              <div className="ml-2 flex max-h-full w-full flex-col justify-start">
                <h3 className="my-[7px] w-60 truncate text-lg font-semibold">
                  {project.name}
                </h3>
                <p className="max-w-full truncate text-base">
                  {project.description}
                </p>
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
