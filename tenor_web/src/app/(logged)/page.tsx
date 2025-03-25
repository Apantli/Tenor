"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { FilterSearch } from "../_components/FilterSearch";
import PrimaryButton from "../_components/PrimaryButton";
import { createECDH } from "crypto";
import createProject, { createEmptyProject } from "~/server/api/routers/createProject";
import { dbAdmin } from "~/utils/firebaseAdmin";

export default function ProjectPage() {
  return (
    <div className="flex flex-row w-full h-full">
      <div className="w-1/2 w-full">
        <div className="">
    <div className="flex flex-row w-full h-full">
      <div className="w-1/2 w-full">
        <div className="">
          <h1>Projects</h1>
        </div>
        <div className="">
        <div className="">
          <ProjectList />
        </div>
      </div>
      <div className="w-1/2 w-full"></div>
      <div className="w-1/2 w-full"></div>
    </div>
  );
}

export const CreateNewProject = () => {
  const router = useRouter();

  const handleCreateProject = async () => {
    const newProject = createEmptyProject();

    const projectID = await createProject(newProject, dbAdmin);

    if (projectID) {
      router.push(`/projects/${projectID}`);
    } else {
      console.error("Error creating project");  
    }
  };

  return <PrimaryButton className={"max-w-[103px] w-full h-full text-xs self-center"} onClick={handleCreateProject}> + New project </PrimaryButton>
};

function ProjectList() {
  const {
    data: projects,
    isLoading,
    error,
  } = api.projects.listProjects.useQuery();
  const [filteredProjects, setFilteredProjects] = useState<typeof projects>([]);

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

  if (!projects?.length) {
    return <p>There are no assigned projects</p>;
  }

  const handleFilter = (filterList: string[]) => {
    if (filterList.length === 0) {
      setFilteredProjects(projects || []);
    } else {
      setFilteredProjects(
        projects?.filter((p) => filterList.includes(p.name)) || [],
        projects?.filter((p) => filterList.includes(p.name)) || [],
      );
    }
  };

  return (
    <div>
      <div className="flex h-full max-h-[33px] justify-between w-full max-w-[490px]">
        <FilterSearch
          list={projects.map((p) => p.name)}
          onSearch={handleFilter}
        />
        <PrimaryButton className={"max-w-[103px] w-full h-full text-xs self-center"} onClick={() => (null)}> + New project </PrimaryButton>
      </div>
      <div className="flex h-full max-h-[33px] justify-between w-full max-w-[490px]">
        <FilterSearch
          list={projects.map((p) => p.name)}
          onSearch={handleFilter}
        />
        <PrimaryButton className={"max-w-[103px] w-full h-full text-xs self-center"} onClick={() => (null)}> + New project </PrimaryButton>
      </div>
      <ul>
        {filteredProjects?.map((project) => (
          <li className="flex h-full max-w-[490px]  justify-start border-b-2 py-[8]" key={project.id}>
            <div className="m-[10px] bg-blue-500 rounded-md h-24 max-w-[66px] max-h-[66px] w-24 flex justify-center items-center">
              <img className="object-scale-down p-[4px]" src={project.link} alt={project.name} />
          <li className="flex h-full max-w-[490px]  justify-start border-b-2 py-[8]" key={project.id}>
            <div className="m-[10px] bg-blue-500 rounded-md h-24 max-w-[66px] max-h-[66px] w-24 flex justify-center items-center">
              <img className="object-scale-down p-[4px]" src={project.link} alt={project.name} />
            </div>
            <div className="max-h-full w-full flex flex-col justify-start ml-2">
              <h3 className="text-lg font-semibold my-[7px]">{project.name}</h3>
              <p className="text-sm">{project.description}</p>
            <div className="max-h-full w-full flex flex-col justify-start ml-2">
              <h3 className="text-lg font-semibold my-[7px]">{project.name}</h3>
              <p className="text-sm">{project.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
