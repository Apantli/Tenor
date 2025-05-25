"use client";

import ProfilePicture from "~/app/_components/ProfilePicture";

import {
  ContributionPieChart,
  ContributionLegend,
  SampleContributionData,
} from "~/app/_components/charts/ContributionPieChart";
import CrossIcon from "@mui/icons-material/Close";
import type { UserCol } from "~/lib/types/columnTypes";
import { api } from "~/trpc/react";
import { emptyRole } from "~/lib/defaultProjectValues";
import { cn } from "~/lib/utils";

export const MemberDetailsCard = ({
  member,
  // timeInterval,
  className,
  projectId,
  setSelectedMember,
}: {
  member: UserCol;
  projectId: string;
  className?: string;
  // timeInterval: string;
  setSelectedMember: (member: UserCol | null) => void;
}) => {
  const { data: roles, isLoading } = api.projects.getUserTypes.useQuery({
    projectId: projectId,
  });

  let roleString =
    roles?.find((role) => role.id === member.roleId)?.label ?? emptyRole.label;

  if (member.roleId === "owner") {
    roleString = "Owner";
  }

  return (
    <div
      className={cn("flex flex-col gap-y-4 rounded-md border-2 p-4", className)}
    >
      <CrossIcon
        onClick={() => setSelectedMember(null)}
        className="ml-auto text-gray-500"
        fontSize="large"
      />
      <div className="flex flex-row gap-3">
        <ProfilePicture
          user={member}
          hideTooltip
          pictureClassName="h-32 w-32 ml-5 my-auto text-5xl"
        />
        <div className="my-auto flex flex-col justify-start overflow-hidden pl-4 pr-4">
          <h3 className="my-[7px] max-w-[500px] truncate text-2xl font-semibold">
            {member.displayName}
          </h3>
          <p className="line-clamp-2 text-xl capitalize text-gray-500">
            {isLoading ? "Loading..." : roleString}
          </p>
        </div>
      </div>

      <div className="mx-8 flex flex-col pt-4">
        <p className="mt-2 text-xl">
          <strong>Email:</strong> {member.email}
        </p>
        <h4 className="mb-4 mt-6 text-xl font-bold">Contribution overview</h4>
        <div className="flex flex-row items-center gap-8">
          <ContributionPieChart data={SampleContributionData} />
          <ContributionLegend />
        </div>
      </div>
    </div>
  );
};
