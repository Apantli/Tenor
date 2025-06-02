"use client";

import React, { useState } from "react";
import HappinessForm from "./HappinessForm";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import ProfilePicture from "~/app/_components/ProfilePicture";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import CheckIcon from "@mui/icons-material/Check";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import ProgressBar from "~/app/_components/ProgressBar";
import dynamic from "next/dynamic";
import { useRetrospectiveCountdown } from "./useRetrospectiveCountdown";

const DynamicPerformanceChart = dynamic(
  () =>
    import("~/app/_components/charts/PerformanceChart").then(
      (m) => m.PerformanceChart,
    ),
  {
    ssr: false,
  },
);

export default function ProjectSprintRetrospectivePage() {
  const { user } = useFirebaseAuth();
  const params = useParams();
  const projectId = params.projectId as string;

  const [answeredQuestionsCount, setAnsweredQuestionsCount] = useState(0);
  const [userClickedShowAnswers, setUserClickedShowAnswers] = useState(false);

  const { data: previousSprint, isLoading: loadingprevSprint } =
    api.sprintRetrospectives.getPreviousSprint.useQuery({
      projectId: projectId,
    });

  const previousSprintId = previousSprint?.id ?? "";
  const { timeRemaining } = useRetrospectiveCountdown(
    previousSprint?.endDate ?? null,
  );

  const { data: sprint, isLoading: loadingSprint } =
    api.sprints.getSprint.useQuery(
      {
        projectId: params.projectId as string,
        sprintId: previousSprintId,
      },
      {
        enabled: !!previousSprintId,
      },
    );

  const { data: sprintRetrospectiveId, isLoading: loadingRetrospectiveId } =
    api.sprintRetrospectives.getRetrospectiveId.useQuery(
      {
        projectId: projectId,
        sprintId: previousSprintId,
      },
      {
        enabled: !!previousSprintId,
      },
    );

  const { data: teamProgressData } =
    api.sprintRetrospectives.getRetrospectiveTeamProgess.useQuery(
      {
        projectId: projectId,
        sprintId: previousSprintId,
      },
      {
        enabled: !!previousSprintId,
        refetchOnWindowFocus: "always",
        staleTime: 0,
      },
    );

  const { data: personalProgressData } =
    api.sprintRetrospectives.getRetrospectivePersonalProgress.useQuery(
      {
        projectId: projectId,
        sprintId: previousSprintId,
        userId: user?.uid ?? "",
      },
      {
        enabled: !!previousSprintId,
        refetchOnWindowFocus: "always",
        staleTime: 0,
      },
    );

  const sprintNumber = sprint?.number;
  const userName =
    user?.displayName ?? user?.email ?? "No name or email provided";

  if (loadingprevSprint || loadingSprint || loadingRetrospectiveId) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  const showMessageOverlay =
    answeredQuestionsCount > 0 && !userClickedShowAnswers;

  const notFinishedYet =
    answeredQuestionsCount > 0 &&
    answeredQuestionsCount < 3 &&
    !userClickedShowAnswers;

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-4 pt-6">
        <h1 className="text-3xl font-semibold">
          Sprint Retrospective for Sprint {sprintNumber && `${sprintNumber}`}
          {timeRemaining && (
            <span className="ml-3 text-sm font-normal text-gray-500">
              Ends in {timeRemaining}
            </span>
          )}
        </h1>
        <p className="mt-2 text-gray-600">
          Congratulations on finishing another sprint! Let&apos;s take a look at
          how it went.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-start overflow-y-auto px-6 pb-6">
        <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
          <div className="flex h-full w-full flex-col rounded-lg border border-app-border bg-white p-6 shadow-sm lg:w-1/2">
            <div className="flex-1 overflow-y-auto">
              <h2 className="mb-4 text-2xl font-semibold">Team Progress</h2>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">User Stories</p>
                  <p className="text-sm text-gray-600">
                    {teamProgressData?.completedUserStories ?? 0} of{" "}
                    {teamProgressData?.totalUserStories ?? 0} completed
                  </p>
                </div>
                <div className="relative">
                  <ProgressBar
                    min={0}
                    max={teamProgressData?.totalUserStories ?? 100}
                    value={teamProgressData?.completedUserStories ?? 0}
                    progressBarColor="#13918A"
                    emptyBarColor="#E5E5E5"
                    className="h-8"
                    compact={true}
                  />
                </div>
              </div>

              {/* Issues Progress */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">Issues</p>
                  <p className="text-sm text-gray-600">
                    {teamProgressData?.completedIssues ?? 0} of{" "}
                    {teamProgressData?.totalIssues ?? 0} completed
                  </p>
                </div>
                <div className="relative">
                  <ProgressBar
                    min={0}
                    max={teamProgressData?.totalIssues ?? 100}
                    value={teamProgressData?.completedIssues ?? 0}
                    progressBarColor="#88BB87"
                    emptyBarColor="#E5E5E5"
                    className="h-8"
                    compact={true}
                  />
                </div>
              </div>

              <h2 className="mb-4 text-2xl font-semibold">Personal Progress</h2>
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">Assigned Tasks</p>
                  <p className="text-sm text-gray-600">
                    {personalProgressData?.completedAssignedTasks ?? 0} of{" "}
                    {personalProgressData?.totalAssignedTasks ?? 0} completed
                  </p>
                </div>
                <div className="relative">
                  <ProgressBar
                    min={0}
                    max={personalProgressData?.totalAssignedTasks ?? 100}
                    value={personalProgressData?.completedAssignedTasks ?? 0}
                    progressBarColor="#88BB87"
                    emptyBarColor="#E5E5E5"
                    className="h-8"
                    compact={true}
                  />
                </div>
              </div>

              <div className="mb-6 flex items-center gap-6">
                <ProfilePicture
                  user={user}
                  className="h-16 w-16 min-w-16 text-xl"
                  hideTooltip
                />
                <div>
                  <p className="text-xl font-semibold">{userName}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col">
                <DynamicPerformanceChart className="ml-8" />
              </div>
            </div>
          </div>

          <div className="relative h-full w-full lg:w-1/2">
            <HappinessForm
              sprintRetrospectiveId={sprintRetrospectiveId}
              onAnsweredCountChange={setAnsweredQuestionsCount}
            />

            {showMessageOverlay && (
              <div className="absolute bottom-1 left-1 right-1 top-1 z-10 flex flex-col items-center justify-center rounded-lg bg-white bg-opacity-75 p-4 text-center backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-center">
                  {notFinishedYet ? (
                    <QuestionMarkIcon sx={{ fontSize: 60 }} />
                  ) : (
                    <CheckIcon sx={{ fontSize: 60 }} />
                  )}
                </div>
                <p className="mb-4 text-xl font-semibold">
                  You have completed {answeredQuestionsCount}/3 answers for your
                  happiness survey.
                </p>
                <PrimaryButton onClick={() => setUserClickedShowAnswers(true)}>
                  {answeredQuestionsCount === 3
                    ? "Retrospective Answers"
                    : "Show Answers"}
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
