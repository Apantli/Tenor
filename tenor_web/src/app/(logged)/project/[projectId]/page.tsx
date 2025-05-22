"use client";

import { useParams } from "next/navigation";
import ProjectInfo from "~/app/_components/sections/ProjectInfo";
import ProjectStatus from "~/app/_components/ProjectStatus";

export default function ProjectOverview() {

  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="flex h-full w-full flex-row items-start">
      <div className="flex w-2/4 flex-col gap-5 p-5">
        <ProjectInfo projectId={projectId} />
      </div>
      <div className="flex w-2/4 flex-col gap-5 border-2 border-[#BECAD4] rounded-lg p-5">
        <ProjectStatus
          projectId={projectId}
        />
      </div>
    </div>
  );
}
