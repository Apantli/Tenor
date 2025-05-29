"use client";

import ProfilePicture from "~/app/_components/ProfilePicture";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

import { ContributionLegend } from "~/app/(logged)/project/[projectId]/performance/ContributionPieChart";
import CrossIcon from "@mui/icons-material/Close";
import type { UserCol } from "~/lib/types/columnTypes";
import { api } from "~/trpc/react";
import { emptyRole } from "~/lib/defaultValues/roles";
import { cn } from "~/lib/helpers/utils";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { formatSeconds } from "~/lib/helpers/parsers";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import dynamic from "next/dynamic";

const DynamicContributionPieChart = dynamic(
  () =>
    import(
      "~/app/(logged)/project/[projectId]/performance/ContributionPieChart"
    ).then((m) => m.ContributionPieChart),
  {
    ssr: false,
  },
);
const DynamicAverageTimeChart = dynamic(
  () =>
    import(
      "~/app/(logged)/project/[projectId]/performance/AverageTimeChart"
    ).then((m) => m.AverageTimeChart),
  {
    ssr: false,
  },
);

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

  const formattedData = sortedAverageTime.map((time, index) => ({
    x: index,
    y: time,
  }));

  return (
    <div
      className={cn(
        "relative mx-auto flex h-[40rem] max-h-[40rem] w-full flex-col overflow-y-auto overflow-x-hidden rounded-md border-2 p-4 pb-0 pt-4 2xl:gap-y-4 2xl:overflow-y-hidden 2xl:pb-12 2xl:pt-12",
        className,
      )}
    >
      <CrossIcon
        onClick={() => setSelectedMember(null)}
        className="absolute right-2 top-2 ml-auto text-gray-500"
        fontSize="large"
      />
      <div className="flex flex-row gap-3">
        <ProfilePicture
          user={member}
          hideTooltip
          pictureClassName="h-14 w-14 2xl:h-24 2xl:w-24 ml-5 my-auto text-xl 2xl:text-5xl"
        />
        <div className="my-auto flex flex-col justify-start overflow-hidden pl-4 pr-4">
          <h3 className="my-[7px] max-w-[500px] truncate text-lg font-semibold capitalize xl:text-2xl">
            {member.displayName}
          </h3>
          <p className="line-clamp-2 text-xl capitalize text-gray-500">
            {isLoading ? "Loading..." : roleString}
          </p>
        </div>
        <div className="mx-auto my-auto text-3xl 2xl:text-6xl">
          <SentimentSatisfiedAltIcon
            fontSize="inherit"
            className="text-app-green"
          />
        </div>
      </div>

      <div className="mx-8 flex flex-col">
        <p className="mt-2 text-xl">
          <strong>Email:</strong> {member.email}
        </p>
        <h4 className="mb-4 mt-2 text-xl font-bold 2xl:mt-6">
          Contribution overview
        </h4>
        {loadingContributions && (
          <div className="flex flex-row gap-2">
            <LoadingSpinner />
          </div>
        )}
        {!loadingContributions && (
          <div className="">
            {contributionTotal > 0 ? (
              <div className="flex flex-col justify-center gap-8 xl:flex-row xl:items-center xl:justify-around">
                <DynamicContributionPieChart
                  data={formattedUserContributions}
                />
                <ContributionLegend data={formattedUserContributions} />
              </div>
            ) : (
              <p className="text-xl text-gray-500">
                No user contributions in the selected time.
              </p>
            )}
          </div>
        )}
        <h4 className="mb-4 mt-2 text-xl font-bold 2xl:mt-6">
          Average time per task
        </h4>
        <div
          className={cn("flex flex-row gap-8", {
            "items-center justify-around": Boolean(lastTime),
          })}
        >
          {loadingAverageTime ? (
            <div className="flex flex-row items-center gap-2">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <h4
                  className={cn("text-3xl font-bold", {
                    "text-xl font-normal text-gray-500": !Boolean(lastTime),
                  })}
                >
                  {lastTime ??
                    "No tasks completed by this user during the last 5 weeks."}
                </h4>
                {timePercentageDifference && (
                  <div className="flex flex-row gap-2">
                    <p
                      className={cn("text-xl font-bold", {
                        "text-green-400": timePercentageDifference <= 0,
                        "text-red-400": timePercentageDifference > 0,
                      })}
                    >
                      {timePercentageDifference >= 0 && "+"}
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
                  <DynamicAverageTimeChart
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
