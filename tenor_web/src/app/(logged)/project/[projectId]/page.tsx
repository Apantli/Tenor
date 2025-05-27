"use client";

import { useParams } from "next/navigation";
import ProjectInfo from "~/app/_components/sections/ProjectInfo";
import ProjectStatus from "~/app/_components/ProjectStatus";
import ActivityProjectOverview from "~/app/_components/ActivityProjectOverview";
import { useState } from "react";

export default function ProjectOverview() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [isProjectInfoExpanded, setIsProjectInfoExpanded] = useState(false);

  return (
    <div className="flex flex-row h-[calc(100vh-64px)] max-h-full w-full grid-cols-2 grid-rows-[auto_1fr] gap-4 p-4">
      {/* First col - col 1 */}
      <div className="flex flex-col w-full gap-4">
        <div className={`flex flex-col gap-5 transition-all duration-300 ${
            isProjectInfoExpanded ? "max-h-64" : "max-h-[12rem]"
          } h-full`}>
          <ProjectInfo projectId={projectId} onExpandChange={setIsProjectInfoExpanded} />
        </div>
        <div className="flex flex-col border-2 border-[#BECAD4] rounded-lg p-3 overflow-hidden h-full">
          <ActivityProjectOverview projectId={projectId}/>
        </div>
      </div>
      
      {/* Second row - col 2 */}
      <div className="flex flex-col w-full gap-4">
        <div className="flex flex-col gap-5 h-64 border-2 border-[#BECAD4] rounded-lg p-5">
          <ProjectStatus projectId={projectId} />
        </div>
        <div className="flex flex-col border-2 border-[#BECAD4] rounded-lg p-3">
          {/* Future content */}
        </div>
      </div>
    </div>
  );
}
