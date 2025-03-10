"use client"; // Es obligatorio en un componente que usa `useSession()`

import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import fetchUserProjects from "../_components/ProjectInfo";

interface Project {
  id: string;
  project_name: string;
  description: string;
  link: string;
}

export default function ProjectInfo() {
  return (
    <SessionProvider>
      <ProjectInfoContent />
    </SessionProvider>
  );
}

function ProjectInfoContent() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) return;
    console.log("Fetching projects for user", session.user.email);
    const loadProjects = async () => {
      setLoading(true);
      const fetchedProjects = await fetchUserProjects(session.user.email as string);
      setProjects(fetchedProjects);
      setLoading(false);
    };

    loadProjects();
  }, [session]);

  return (
    <div>

      <div className="projects-list__container">
        <div className="header">
          <h1>Projects</h1>
        </div>
        <div className="projects-list__content">
          {projects.length > 0 ? (
            <ul>
              {projects.map((project) => (
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
            <p>There are no assign projects</p>
          )}
        </div>
      </div>
      <div className="projects-dashboard__container">

      </div>
    </div>
  );
}
