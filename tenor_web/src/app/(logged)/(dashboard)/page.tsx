"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FilterSearch } from "~/app/_components/FilterSearch";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";

export default function ProjectPage() {
  return (
    <div className="flex h-full w-full flex-row">
      <div className="w-full">
        <div className="">
          <h1>Projects</h1>
        </div>
        <div className="">
          <ProjectList />
        </div>
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
    <PrimaryButton
      className={"h-full w-full max-w-[103px] self-center text-xs"}
      onClick={handleCreateProject}
    >
      {" "}
      + New project{" "}
    </PrimaryButton>
  );
};

function ProjectList() {
  const {
    data: projects,
    isLoading,
    error,
  } = api.projects.listProjects.useQuery();
  const [filteredProjects, setFilteredProjects] = useState<typeof projects>([]);

  /**
   * * This function is used to open a project when the user clicks on the project image.
   * * This would be something provisional while we are in the development phase.
   */
  const router = useRouter();

  const handleOpenProject = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  useEffect(() => {
    if (projects) {
      setFilteredProjects(projects);
    }
  }, [projects]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error?.data?.code == "UNAUTHORIZED") {
    return <p>Log in to view this information</p>;
  }

  const handleFilter = (filterList: string[]) => {
    if (filterList.length === 0) {
      setFilteredProjects(projects ?? []);
    } else {
      setFilteredProjects(
        projects?.filter((p) => filterList.includes(p.name)) ?? [],
      );
    }
  };

  return (
    <div>
      <div className="flex h-full max-h-[33px] w-full max-w-[490px] justify-between">
        <FilterSearch
          list={projects?.map((p) => p.name) ?? []}
          onSearch={handleFilter}
          placeholder="Search project..."
        />
        <CreateNewProject />
      </div>
      <ul>
        {filteredProjects && filteredProjects?.length > 0 ? (
          filteredProjects?.map((project) => (
            <li
              className="flex h-full max-w-[490px] justify-start border-b-2 py-[8] hover:cursor-pointer"
              key={project.id}
              onClick={() => handleOpenProject(project.id)}
            >
              <div className="m-[10px] flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-md bg-white">
                <img
                  className="h-full w-full rounded-md object-contain p-[4px]"
                  src={project.logo}
                  alt={project.name}
                />
              </div>
              <div className="ml-2 flex max-h-full w-full flex-col justify-start">
                <h3 className="my-[7px] text-lg font-semibold">
                  {project.name}
                </h3>
                <p className="text-sm">{project.description}</p>
              </div>
            </li>
          ))
        ) : (
          <li className="flex h-full max-w-[490px] justify-start border-b-2 py-[8]">
            <div className="mt-4">
              <p className="text-gray-500">No projects found.</p>

              <p className="text-sm text-gray-500">
                Try creating a project or ask a project owner to add you to a
                project.{" "}
              </p>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}
