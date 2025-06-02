"use client";

import { ProjectStatusDashboard } from "~/app/(logged)/(dashboard)/ProjectStatusDashboard";
import ProjectList from "./ProjectList";
import ActivityProjectOverview from "~/app/_components/ActivityProjectOverview";
import { useState } from "react";

export default function ProjectPage() {
  // const { data: projects } = api.projects.listProjects.useQuery();
  const [projectId, setProjectId] = useState<string | null>(null);
  return (
    <div className="h-full w-full flex-col items-start lg:flex lg:flex-row">
      <div className="lg:w-[50%]">
        <h1 className="mb-3 w-full text-3xl font-semibold">Projects</h1>
        <ProjectList projectId={projectId} setProjectId={setProjectId} />
      </div>
      <div className="h-full flex-1 pb-10 pt-10">
        {projectId ? (
          <ActivityProjectOverview projectId={projectId} />
        ) : (
          <ProjectStatusDashboard />
        )}
      </div>
    </div>
  );
}
