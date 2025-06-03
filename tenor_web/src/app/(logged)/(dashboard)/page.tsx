"use client";

import { ProjectStatusDashboard } from "~/app/(logged)/(dashboard)/ProjectStatusDashboard";
import ProjectList from "./ProjectList";
import ActivityProjectOverview from "~/app/_components/ActivityProjectOverview";
import { api } from "~/trpc/react";

export default function ProjectPage() {
  const { data: projects } = api.projects.getTopProjectStatus.useQuery({
    count: 1,
  });
  return (
    <div className="h-full w-full flex-col items-start lg:flex lg:flex-row">
      <div className="lg:w-[50%]">
        <h1 className="mb-3 w-full text-3xl font-semibold">Projects</h1>
        <ProjectList />
      </div>
      <div className="h-full flex-1 py-10">
        <ProjectStatusDashboard />
        <div className="my-6" />
        {projects?.topProjects[0] && (
          <ActivityProjectOverview
            projectId={projects?.topProjects[0].projectId}
          />
        )}
      </div>
    </div>
  );
}
