"use client"; // Es obligatorio en un componente que usa `useSession()`

import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { ChangeEvent, useEffect, useState } from "react";
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
  //Variable para almacenar la busqueda
  const [filterProjects, setFilterProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (!session?.user?.email) return;
    console.log("Fetching projects for user", session.user.email);
    const loadProjects = async () => {
      setLoading(true);
      const fetchedProjects = await fetchUserProjects(session.user.email as string);
      setProjects(fetchedProjects);
      setFilterProjects(fetchedProjects);
      setLoading(false);
    };

    loadProjects();
  }, [session]);

  //Funcion para filtrar los proyectos por medio del nombre del proyecto
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    //Filtrar los proyectos por el nombre del proyecto
    if (query === "") {
      setFilterProjects([]);
    } else {
      const lowercasedQuery = query.toLowerCase();
      const filtered = projects.filter(
        (projects) => projects.project_name.toLowerCase().includes(lowercasedQuery)
      );
      setFilterProjects(filtered);
    }
  };

  return (
    <div>

      <div className="projects-list__container">
        <div className="header">
          <h1>Projects</h1>
        </div>
        <div className="projects-list__search-bar">
          <input
            type="text"
            placeholder="Find a project..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-bar"
          />
        </div>
        <div className="projects-list__content">
          { loading ? (
            <p>Seaching projects... </p>
          ):  filterProjects.length > 0 ? (
            <ul>
              {filterProjects.map((project) => (
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
