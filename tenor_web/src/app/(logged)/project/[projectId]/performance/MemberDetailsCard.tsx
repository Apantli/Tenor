"use client";

import ProfilePicture from "~/app/_components/ProfilePicture";
import { ContributionLegend } from "~/app/(logged)/project/[projectId]/performance/ContributionLegend";
import CrossIcon from "@mui/icons-material/Close";
import type { UserCol } from "~/lib/types/columnTypes";
import { api } from "~/trpc/react";
import { emptyRole } from "~/lib/defaultValues/roles";
import { cn } from "~/lib/helpers/utils";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import SentimentNeutralIcon from "@mui/icons-material/SentimentNeutral";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";

import dynamic from "next/dynamic";
import { defaultPerformanceData } from "~/lib/defaultValues/performance";

const DynamicContributionPieChart = dynamic(
  () =>
    import(
      "~/app/(logged)/project/[projectId]/performance/ContributionPieChart"
    ).then((m) => m.ContributionPieChart),
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
  const { data: userSentiment, isLoading: loadingSentiment } =
    api.performance.getLastUserSentiment.useQuery({
      projectId: projectId,
      userId: member.id,
    });

  const { data: userContributions, isLoading: loadingContributions } =
    api.performance.getContributionOverview.useQuery(
      {
        projectId: projectId,
        userId: member.id,
        time: timeInterval,
      },
      {
        retry: 0,
      },
    );

  let roleString =
    roles?.find((role) => role.id === member.roleId)?.label ?? emptyRole.label;

  if (member.roleId === "owner") {
    roleString = "Owner";
  }

  const formattedUserContributions = Object.entries(
    userContributions ?? defaultPerformanceData,
  )
    .map(([key, value]) => ({
      category: key,
      value: value,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  const totalValue = formattedUserContributions?.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  if (totalValue === 0) {
    formattedUserContributions.push({ category: "No Contributions", value: 1 });
  }

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full flex-col overflow-x-hidden rounded-md border-2 p-4 pb-0 pt-4 2xl:gap-y-4 2xl:pb-6 2xl:pt-6",
        className,
      )}
    >
      <CrossIcon
        onClick={() => setSelectedMember(null)}
        className="absolute right-2 top-2 ml-auto cursor-pointer text-gray-500"
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
          <p className="line-clamp-2 text-base capitalize text-gray-500 xl:text-xl">
            {isLoading ? "Loading..." : roleString}
          </p>
        </div>
        <div className="my-auto ml-auto mr-10 text-3xl 2xl:text-6xl">
          <SentimentIcon
            sentiment={userSentiment?.happiness}
            isLoading={loadingSentiment}
          />
        </div>
      </div>

      <div className="mx-8 flex flex-col">
        <h4 className="mb-4 mt-2 text-base font-bold xl:text-xl 2xl:mt-6">
          Contribution overview
        </h4>
        {loadingContributions && (
          <div className="flex flex-row gap-2">
            <LoadingSpinner />
          </div>
        )}
        {!loadingContributions && (
          <div className="flex flex-col justify-center gap-8 xl:flex-row xl:items-center xl:justify-around">
            <DynamicContributionPieChart
              data={formattedUserContributions}
              scaleFactor={0.8}
            />
            <ContributionLegend data={formattedUserContributions} />
          </div>
        )}
      </div>
    </div>
  );
};

export const SentimentIcon = ({
  sentiment,
  isLoading,
}: {
  sentiment?: number;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }
  if (!sentiment) {
    return (
      <SentimentNeutralIcon fontSize="inherit" className="text-gray-500" />
    );
  } else if (sentiment >= 7) {
    return (
      <SentimentSatisfiedAltIcon
        fontSize="inherit"
        className="text-app-green"
      />
    );
  } else if (sentiment >= 5) {
    return (
      <SentimentNeutralIcon fontSize="inherit" className="text-[#f1db30]" />
    );
  } else {
    return (
      <SentimentDissatisfiedIcon
        fontSize="inherit"
        className="text-[#e76478]"
      />
    );
  }
};
