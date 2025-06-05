"use client";

import { ProjectStatusDashboard } from "~/app/(logged)/(dashboard)/ProjectStatusDashboard";
import ProjectList from "./ProjectList";
import ActivityProjectDashboard from "./ActivityProjectDashboard";

export default function ProjectPage() {
  return (
    <div className="h-full w-full flex-col items-start overflow-hidden lg:flex lg:flex-row">
      <div className="lg:w-[50%]">
        <h1 className="pb-3 pt-0 p-4 w-full text-3xl font-semibold lg:ps-0">Projects</h1>
        <ProjectList />
      </div>
      <div className="h-[80vh] flex-1">
        <ProjectStatusDashboard />
        <div className="my-6" />

        <ActivityProjectDashboard />
      </div>
    </div>
  );
}
