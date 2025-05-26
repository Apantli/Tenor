"use client";

import { ProjectStatus } from "~/app/(logged)/(dashboard)/ProjectStatus";
import ProjectList from "./ProjectList";

export default function ProjectPage() {
  return (
    <div className="flex h-full w-full flex-col items-start xl:flex-row">
      <div className="flex-1 xl:flex-[2]">
        <h1 className="mb-3 text-3xl font-semibold">Projects</h1>
        <ProjectList />
      </div>
      <div className="w-full flex-1 pt-10 xl:w-fit xl:flex-[2]">
        <ProjectStatus className="h-[38vh]" />
        {/* FIXME: Remove when recent activity is ready */}
        <div
          className="mt-4 h-[38vh] w-full rounded-md border-2 bg-cover bg-no-repeat"
          style={{ backgroundImage: 'url("/recent_activity_mockup.png")' }}
          aria-label="Dashboard mockup"
        />
      </div>
    </div>
  );
}
