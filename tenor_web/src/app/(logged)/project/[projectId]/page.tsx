"use client";

import { useParams } from "next/navigation";
import ProjectInfo from "~/app/_components/sections/ProjectInfo";
import ProjectStatus from "~/app/_components/ProjectStatus";
import ActivityProjectOverview from "~/app/_components/ActivityProjectOverview";

export default function ProjectOverview() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="grid h-[calc(100vh-64px)] max-h-full w-full grid-cols-2 grid-rows-[auto_1fr] gap-4 p-4">
      {/* Top row - cell 1 */}
      <div className="flex flex-col gap-5 p-5 h-64">
        <ProjectInfo projectId={projectId} />
      </div>
      
      {/* Top row - cell 2 */}
      <div className="flex flex-col gap-5 h-64 border-2 border-[#BECAD4] rounded-lg p-5">
        <ProjectStatus projectId={projectId} />
      </div>
      
      {/* Bottom row - cell 1 */}
      <div className="flex flex-col border-2 border-[#BECAD4] rounded-lg p-3 overflow-hidden h-full">
        <ActivityProjectOverview projectId={projectId}/>
      </div>
      
      {/* Bottom row - cell 2 */}
      <div className="flex flex-col border-2 border-[#BECAD4] rounded-lg p-3">
        {/* Future content */}
      </div>
    </div>
  );
}
