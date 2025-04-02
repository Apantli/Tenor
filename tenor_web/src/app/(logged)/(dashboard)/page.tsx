"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FilterSearch } from "~/app/_components/FilterSearch";
import PrimaryButton from "~/app/_components/PrimaryButton";

export default function ProjectPage() {
  return (
    <div className="flex h-full w-full flex-row">
      <div className="w-1/2 w-full">
        <div className="">
          <h1>Projects</h1>
        </div>
        <div className="">
          <ProjectList />
        </div>
      </div>
      <div className="w-1/2 w-full"></div>
    </div>
  );
}

const CreateNewProject = () => {
  const router = useRouter();
  const { mutateAsync: createProject } =
    api.projects.createProject.useMutation();

  const handleCreateProject = async () => {
    const response = await createProject();

    if (response.success) {
      router.push(`/project/${response.projectId}`);
    } else {
      console.error("Error creating project");
    }
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

  // FIXME: When there are no projects, you cannot see the "create new project" button, so you are locked.
  if (!projects?.length) {
    return <p>There are no assigned projects</p>;
  }

  const handleFilter = (filterList: string[]) => {
    if (filterList.length === 0) {
      setFilteredProjects(projects || []);
    } else {
      setFilteredProjects(
        projects?.filter((p) => filterList.includes(p.name)) || [],
      );
    }
  };

  return (
    <div>
      <div className="flex h-full max-h-[33px] w-full max-w-[490px] justify-between">
        <FilterSearch
          list={projects.map((p) => p.name)}
          onSearch={handleFilter}
          placeholder="Search project..."
        />
        <CreateNewProject />
      </div>
      <ul>
        {filteredProjects?.map((project) => (
          <li
            className="flex h-full max-w-[490px] justify-start border-b-2 py-[8]"
            key={project.id}
          >
            <button onClick={() => handleOpenProject(project.id)} className="m-[10px] flex h-24 max-h-[66px] w-24 max-w-[66px] items-center justify-center rounded-md bg-blue-500">
              <img
                className="object-scale-down p-[4px]"
                src={project.logoUrl}
                alt={project.name}
              />
            </button>
            <div className="ml-2 flex max-h-full w-full flex-col justify-start">
              <h3 className="my-[7px] text-lg font-semibold">{project.name}</h3>
              <p className="text-sm">{project.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
