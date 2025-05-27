"use client";

import { useParams } from "next/navigation";
import ProjectInfo from "~/app/_components/sections/ProjectInfo";
import ProjectStatus from "~/app/_components/ProjectStatus";

export default function ProjectOverview() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex h-full w-full flex-row items-start">
        <div className="flex h-64 w-1/2 flex-col gap-5 p-5">
          <ProjectInfo projectId={projectId} />
        </div>
        <div className="ml-5 flex h-64 w-1/2 flex-col gap-5 rounded-lg border border-[#BECAD4] p-5">
          <ProjectStatus projectId={projectId} />
        </div>
      </div>
      <div className="flex h-full w-full flex-row items-start gap-5">
        <div
          className="mt-4 h-[45vh] w-full rounded-md border-2 bg-cover bg-no-repeat"
          style={{
            backgroundImage: 'url("/mockups/project_activity_mockup.png")',
          }}
          aria-label="Dashboard mockup"
        />
        <div
          className="mt-4 h-[45vh] w-full rounded-md border-2 bg-cover bg-no-repeat"
          style={{ backgroundImage: 'url("/mockups/task_chart_mockup.png")' }}
          aria-label="Dashboard mockup"
        />
      </div>
    </div>
  );
}
