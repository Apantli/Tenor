"use client";

import { ProjectStatusDashboard } from "~/app/(logged)/(dashboard)/ProjectStatusDashboard";
import ProjectList from "./ProjectList";
import ActivityProjectOverview from "~/app/_components/ActivityProjectOverview";
import { useState } from "react";

export default function ProjectPage() {
  // const { data: projects } = api.projects.listProjects.useQuery();
  const [projectId, setProjectId] = useState<string | null>(null);
  return (
    <div className="flex h-full w-full flex-col items-start xl:flex-row">
      <div className="flex-1 xl:flex-[2]">
        <h1 className="mb-3 text-3xl font-semibold">Projects</h1>
        <ProjectList projectId={projectId} setProjectId={setProjectId} />
      </div>
      <div className="w-full flex-1 pt-10 xl:w-fit xl:flex-[2]">
        {projectId ? (
          <ActivityProjectOverview projectId={projectId} />
        ) : (
          <ProjectStatusDashboard className="h-[38vh]" />
        )}
      </div>
    </div>
  );
}
