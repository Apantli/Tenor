"use client";

import { useParams } from "next/navigation";
import ProjectInfo from "~/app/_components/sections/ProjectInfo";
import ProjectStatus from "~/app/_components/ProjectStatus";
import ActivityProjectOverview from "~/app/_components/ActivityProjectOverview";

export default function ProjectOverview() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="flex h-full w-full flex-col items-start justify center">
      <div className="flex h-full w-full flex-row items-start justify center">
        <div className="flex w-1/2 flex-col gap-5 p-5 h-64">
          <ProjectInfo projectId={projectId} />
        </div>
        <div className="flex w-1/2 flex-col gap-5 h-64 border-2 border-[#BECAD4]  rounded-lg p-5">
          <ProjectStatus
            projectId={projectId}
          />
        </div>
      </div>
      <div>
        <div>

        </div>
      </div>
      <div className="w-1/2">
        <div className="flex h-80 w-full flex-col border-2 border-[#BECAD4] rounded-lg p-3">
          <ActivityProjectOverview projectId={projectId}/>
        </div>
      </div>
    </div>
  );
}
