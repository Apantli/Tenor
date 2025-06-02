"use client";

import { useParams } from "next/navigation";
import ProjectInfo from "~/app/(logged)/project/[projectId]/ProjectInfo";
import ProjectStatus from "~/app/(logged)/project/[projectId]/ProjectStatusOverview";
import ActivityProjectOverview from "~/app/_components/ActivityProjectOverview";
import { useState } from "react";

export default function ProjectOverview() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [isProjectInfoExpanded, setIsProjectInfoExpanded] = useState(false);

  return (
    <div className="m-6 flex-1 p-4">
      <div className="flex h-[calc(100vh-64px)] max-h-full w-full grid-cols-2 grid-rows-[auto_1fr] flex-row gap-4 p-4">
        {/* First col - col 1 */}
        <div className="flex w-full flex-col gap-4">
          <div
            className={`flex flex-col gap-5 transition-all duration-300 ${
              isProjectInfoExpanded ? "max-h-64" : "max-h-[12rem]"
            } h-full`}
          >
            <ProjectInfo
              projectId={projectId}
              onExpandChange={setIsProjectInfoExpanded}
            />
          </div>

          <ActivityProjectOverview projectId={projectId} />
        </div>

        {/* Second col - col 2 */}
        <div className="flex w-full flex-col gap-4">
          <div className="flex h-64 flex-col gap-5 rounded-lg border-2 border-[#BECAD4] p-5">
            <ProjectStatus projectId={projectId} />
          </div>
          <div className="flex flex-col rounded-lg border-2 border-[#BECAD4] p-3">
            {/* Future content */}
          </div>
        </div>
      </div>
    </div>
  );
}
