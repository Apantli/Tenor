"use client";

import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import { FilterSearch } from "../_components/FilterSearch";

export default function ProjectPage() {
  return (
    <div>
      <div className="projects-list__container">
        <div className="header">
          <h1>Projects</h1>
        </div>
        <div className="projects-list__content">
          <ProjectList />
        </div>
      </div>
      <div className="projects-dashboard__container"></div>
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
        projects?.filter((p) => filterList.includes(p.project_name)) || [],
      );
    }
  };

  return (
    <div>
      <FilterSearch
        list={projects.map((p) => p.project_name)}
        onSearch={handleFilter}
      />
      <ul>
        {filteredProjects?.map((project) => (
          <li className="project-card" key={project.id}>
            <div className="project-logo">
              <img src={project.link} alt={project.project_name} />
            </div>
            <div className="project-info">
              <h3 className="subheader">{project.project_name}</h3>
              <p>{project.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
