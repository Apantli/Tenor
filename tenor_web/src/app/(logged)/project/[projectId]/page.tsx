"use client";

import { useParams } from "next/navigation";
import ProjectInfo from "~/app/(logged)/project/[projectId]/ProjectInfo";
import ProjectStatus from "~/app/(logged)/project/[projectId]/ProjectStatusOverview";
import ActivityProjectOverview from "~/app/_components/ActivityProjectOverview";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

export default function ProjectOverview() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [isProjectInfoExpanded, setIsProjectInfoExpanded] = useState(false);

  // Dynamically import the BurndownChart component to avoid SSR issues
  const DynamicBurdownChart = useMemo(
    () =>
      dynamic(() => import("./BurndownChart"), {
        ssr: false,
      }),
    [],
  );

  return (
    <div className="m-6 h-full flex-1 overflow-scroll px-4">
      <div className="flex h-full max-h-full w-full flex-col gap-8 p-4 lg:flex lg:flex-row">
        {/* First col - col 1 */}
        <div className="flex min-h-[70vh] w-full flex-col justify-between gap-4">
          <div
            className={`flex flex-col gap-5 transition-all duration-300 ${
              isProjectInfoExpanded ? "lg:max-h-64 sm:max-h-full" : "lg:max-h-[13rem] sm:max-h-[15rem]"
            } h-full`}
          >
            <ProjectInfo
              projectId={projectId}
              onExpandChange={setIsProjectInfoExpanded}
            />
          </div>

          <ActivityProjectOverview
            projectId={projectId}
            className="h-full justify-self-end"
          />
        </div>

        {/* Second col - col 2 */}
        <div className="flex w-full flex-col gap-8">
          <div className="flex h-64 flex-col gap-5 rounded-lg border-2 border-[#BECAD4] p-5">
            <ProjectStatus projectId={projectId} />
          </div>

          <div className="flex h-full max-h-[50vh] flex-col rounded-lg border-2 border-[#BECAD4] p-5 lg:max-h-[calc(100%-287px)]">
            <DynamicBurdownChart projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}
