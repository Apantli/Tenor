"use client";

import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import { FilterSearch } from "~/app/_components/FilterSearch";
import PrimaryButton from "~/app/_components/PrimaryButton";
import SecondaryButton from "~/app/_components/SecondaryButton";

export default function ProjectPage() {
  return (
    <div className="flex h-full w-full flex-row">
      <div className="w-1/2 w-full">
        <div className="">
          <h1>Projects</h1>
        </div>
<<<<<<< HEAD
        <div>
=======
<<<<<<<< HEAD:tenor_web/src/app/(logged)/page.tsx
        <div className="projects-list__content">
========
        <div>
>>>>>>>> 029a6cd (Tab bar navigation):tenor_web/src/app/(logged)/(dashboard)/page.tsx
>>>>>>> 029a6cd (Tab bar navigation)
          <ProjectList />
          <SecondaryButton className="mt-6" href="/project/1">
            Open sample project
          </SecondaryButton>
        </div>
<<<<<<< HEAD
      </div>
      <div className="w-1/2 w-full"></div>
=======
        <br />
        <PrimaryButton
          onClick={() => alert("Wow", "This is cool", { type: "success" })}
        >
          Generate Success Alert
        </PrimaryButton>
        <br></br>
        <PrimaryButton
          onClick={() =>
            alert("Oops...", "This is not cool", {
              type: "error",
              duration: 5000,
            })
          }
        >
          Generate Error Alert
        </PrimaryButton>
      </div>
      <div className="projects-dashboard__container"></div>
>>>>>>> 029a6cd (Tab bar navigation)
    </div>
  );
}

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
<<<<<<< HEAD
        projects?.filter((p) => filterList.includes(p.name)) || [],
=======
        projects?.filter((p) => filterList.includes(p.project_name)) || [],
>>>>>>> 029a6cd (Tab bar navigation)
      );
    }
  };

  return (
    <div>
      <div className="flex h-full max-h-[33px] w-full max-w-[490px] justify-between">
        <FilterSearch
          list={projects.map((p) => p.name)}
          onSearch={handleFilter}
        />
        <PrimaryButton
          className={"h-full w-full max-w-[103px] self-center text-xs"}
          onClick={() => null}
        >
          {" "}
          + New project{" "}
        </PrimaryButton>
      </div>
      <ul>
        {filteredProjects?.map((project) => (
          <li
            className="flex h-full max-w-[490px] justify-start border-b-2 py-[8]"
            key={project.id}
          >
            <div className="m-[10px] flex h-24 max-h-[66px] w-24 max-w-[66px] items-center justify-center rounded-md bg-blue-500">
              <img
                className="object-scale-down p-[4px]"
                src={project.link}
                alt={project.name}
              />
            </div>
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
