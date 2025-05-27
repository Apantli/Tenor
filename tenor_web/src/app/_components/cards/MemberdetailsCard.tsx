"use client";

import ProfilePicture from "~/app/_components/ProfilePicture";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

import {
  ContributionPieChart,
  ContributionLegend,
} from "~/app/_components/charts/ContributionPieChart";
import CrossIcon from "@mui/icons-material/Close";
import type { UserCol } from "~/lib/types/columnTypes";
import { api } from "~/trpc/react";
import { emptyRole } from "~/lib/defaultProjectValues";
import { cn } from "~/lib/utils";
import LoadingSpinner from "../LoadingSpinner";
import { formatSeconds } from "~/utils/helpers/parsers";
import { AverageTimeChart } from "../charts/AverageTimeChart";

export const MemberDetailsCard = ({
  member,
  timeInterval,
  className,
  projectId,
  setSelectedMember,
}: {
  member: UserCol;
  projectId: string;
  className?: string;
  timeInterval: string;
  setSelectedMember: (member: UserCol | null) => void;
}) => {
  const { data: roles, isLoading } = api.projects.getUserTypes.useQuery({
    projectId: projectId,
  });

  const { data: userContributions, isLoading: loadingContributions } =
    api.performance.getContributionOverview.useQuery({
      projectId: projectId,
      userId: member.id,
      time: timeInterval,
    });

  let roleString =
    roles?.find((role) => role.id === member.roleId)?.label ?? emptyRole.label;

  if (member.roleId === "owner") {
    roleString = "Owner";
  }

  const formattedUserContributions = userContributions
    ? Object.entries(userContributions)
        .map(([key, value]) => ({
          category: key,
          value: value,
        }))
        .sort((a, b) => a.category.localeCompare(b.category))
    : [];

  const contributionTotal = formattedUserContributions.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const { data: averageTime, isLoading: loadingAverageTime } =
    api.performance.getAverageTimeTask.useQuery({
      projectId: projectId,
      userId: member.id,
    });

  const sortedAverageTime = Object.keys(averageTime ?? {})
    .sort()
    .map((key) => averageTime?.[key])
    .filter((value) => value !== undefined)
    .filter((value) => value !== 0);

  const lastTime = sortedAverageTime.length
    ? formatSeconds(sortedAverageTime[sortedAverageTime.length - 1])
    : null;

  let timePercentageDifference: number | null = null;

  if (sortedAverageTime.length > 1) {
    const prevWeek = sortedAverageTime[sortedAverageTime.length - 2];
    const currWeek = sortedAverageTime[sortedAverageTime.length - 1];
    if (prevWeek && currWeek && prevWeek + currWeek > 0) {
      timePercentageDifference = Number(
        (((currWeek - prevWeek) / ((prevWeek + currWeek) / 2)) * 100).toFixed(
          2,
        ),
      );
    }
  }

  timePercentageDifference = 10;

  const formattedData = sortedAverageTime.map((time, index) => ({
    x: index,
    y: time,
  }));

  console.log("formattedData:", formattedData);

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
          <h3 className="my-[7px] max-w-[500px] truncate text-2xl font-semibold capitalize">
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
        {loadingContributions && (
          <div className="flex flex-row gap-2">
            <LoadingSpinner />
            <p className="text-xl text-gray-500">Loading contributions...</p>
          </div>
        )}
        {!loadingContributions && (
          <>
            {contributionTotal > 0 ? (
              <div className="flex flex-row items-center gap-8">
                <ContributionPieChart data={formattedUserContributions} />
                <ContributionLegend data={formattedUserContributions} />
              </div>
            ) : (
              <p className="text-xl text-gray-500">
                No user contributions in the selected time.
              </p>
            )}
          </>
        )}
        <h4 className="mb-4 mt-6 text-xl font-bold">Average time per task</h4>
        <div className="flex flex-row items-center justify-between gap-8">
          {loadingAverageTime ? (
            <div className="flex flex-row items-center gap-2">
              <LoadingSpinner />
              <p className="text-xl text-gray-500">Loading average time...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <h4
                  className={cn("text-3xl font-bold", {
                    "text-lg font-normal text-gray-500": !Boolean(lastTime),
                  })}
                >
                  {lastTime ??
                    "No tasks completed by this user during the last 5 weeks"}
                </h4>
                {timePercentageDifference && (
                  <div className="flex flex-row gap-2">
                    <p
                      className={cn("text-xl font-bold", {
                        "text-green-400": timePercentageDifference <= 0,
                        "text-red-400": timePercentageDifference > 0,
                      })}
                    >
                      {timePercentageDifference}%
                    </p>
                    {timePercentageDifference <= 0 ? (
                      <TrendingUpIcon className="text-green-400" />
                    ) : (
                      <TrendingDownIcon className="text-red-400" />
                    )}
                  </div>
                )}
              </div>
              {timePercentageDifference && (
                <div className="flex flex-col">
                  <AverageTimeChart
                    data={formattedData}
                    isGreen={timePercentageDifference <= 0}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
