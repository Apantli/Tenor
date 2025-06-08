"use client";

import { useParams } from "next/navigation";
import ProjectInfo from "~/app/(logged)/project/[projectId]/ProjectInfo";
import ProjectStatus from "~/app/(logged)/project/[projectId]/ProjectStatusOverview";
import ActivityProjectOverview from "~/app/_components/ActivityProjectOverview";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "~/trpc/react";
import { permissionNumbers } from "~/lib/types/firebaseSchemas";
import NoAccess from "~/app/_components/NoAccess";
import { useGetPermission } from "~/app/_hooks/useGetPermission";
import { activityPermissions } from "~/lib/defaultValues/permission";

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

  const { data: role, isLoading: isLoadingRole } =
    api.settings.getMyRole.useQuery({ projectId });

  const activityPermission = useGetPermission(activityPermissions);

  if (isLoadingRole || !role) return <></>;

  const showStatusAndBurndown = role.sprints >= permissionNumbers.read;
  const showActivity = activityPermission >= permissionNumbers.read;

  return (
    <div className="m-6 h-full flex-1 overflow-scroll px-4">
      <div className="flex h-full max-h-full w-full flex-col gap-8 p-4 lg:flex lg:flex-row">
        {/* First col - col 1 */}
        <div className="flex min-h-[70vh] w-full flex-col justify-between gap-4">
          <div
            className={`flex flex-col gap-5 transition-all duration-300 ${
              isProjectInfoExpanded
                ? "sm:max-h-full lg:max-h-64"
                : "sm:max-h-[15rem] lg:max-h-[13rem]"
            } h-full`}
          >
            <ProjectInfo
              projectId={projectId}
              onExpandChange={setIsProjectInfoExpanded}
            />
          </div>

          <div className="flex h-full max-h-[580px] flex-col justify-self-end overflow-hidden rounded-lg border-2 border-[#BECAD4] p-5">
            {showActivity && <ActivityProjectOverview projectId={projectId} />}
            {!showActivity && <NoAccess />}
          </div>
        </div>

        {/* Second col - col 2 */}
        <div className="flex w-full flex-col gap-8">
          <div className="flex h-64 flex-col gap-5 rounded-lg border-2 border-[#BECAD4] p-5">
            {showStatusAndBurndown && <ProjectStatus projectId={projectId} />}
            {!showStatusAndBurndown && <NoAccess />}
          </div>

          <div className="flex h-full max-h-[50vh] flex-col rounded-lg border-2 border-[#BECAD4] p-5 lg:max-h-[calc(100%-287px)]">
            {showStatusAndBurndown && (
              <DynamicBurdownChart projectId={projectId} />
            )}
            {!showStatusAndBurndown && <NoAccess />}
          </div>
        </div>
      </div>
    </div>
  );
}
