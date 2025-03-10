"use client";

import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { ChangeEvent, useEffect, useState } from "react";
import { api } from "~/trpc/react";

export default function ProjectInfo() {
  return (
    <SessionProvider>
      <ProjectInfoContent />
    </SessionProvider>
  );
}

function ProjectInfoContent() {
  const { data: projectsData, isLoading } =
    api.projects.listProjects.useQuery();

  return (
    <div>
      <div className="projects-list__container">
        <div className="header">
          <h1>Projects</h1>
        </div>
        <div className="projects-list__content">
          {isLoading ? (
            <p>Seaching projects... </p>
          ) : projectsData != undefined && projectsData.length > 0 ? (
            <ul>
              {projectsData.map((project) => (
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
          ) : (
            <p>There are no assigned projects</p>
          )}
        </div>
      </div>
      <div className="projects-dashboard__container"></div>
    </div>
  );
}
