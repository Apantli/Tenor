"use client";

import { api } from "~/trpc/react";

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
  const projects = api.projects.listProjects.useQuery();

  if (projects.isLoading) {
    return <p>Loading...</p>;
  }

  if (projects.error?.data?.code == "UNAUTHORIZED") {
    return <p>Log in to view this information</p>;
  }

  if (projects.data?.length == 0) {
    return <p>There are no assigned projects</p>;
  }

  return (
    <ul>
      {projects.data?.map((project) => (
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
  );
}
