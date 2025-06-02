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
import dynamic from "next/dynamic";

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

  const sprintNumber = sprint?.number;
  const teamProgress = 90;
  const personalProgress = 100;
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
    <div className="m-6 flex-1 p-4">
      <div className="flex h-full flex-col justify-start overflow-y-auto">
        <h1 className="text-3xl font-semibold">
          Sprint retrospective for Sprint {sprintNumber && `${sprintNumber}`}
        </h1>
        <p className="mb-5 text-gray-600">
          Congratulations on finishing another sprint! Let&apos;s take a look at
          how it went.
        </p>

        <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
          <div className="flex h-full w-full flex-col rounded-lg border border-app-border bg-white p-6 shadow-sm lg:w-1/2">
            <h2 className="mb-4 text-2xl font-semibold">Team Progress</h2>
            <div className="mb-6">
              <p className="mb-2 font-medium">90% of user stories completed</p>
              <div className="h-8 w-full overflow-hidden rounded-md bg-gray-200">
                <div
                  className="h-full bg-app-secondary"
                  style={{ width: `${teamProgress}%` }}
                />
              </div>
            </div>

            <h2 className="mb-4 text-2xl font-semibold">Personal Progress</h2>
            <div className="mb-6">
              <p className="mb-2 font-medium">100% of your tasks completed</p>
              <div className="h-8 w-full overflow-hidden rounded-md bg-gray-200">
                <div
                  className="h-full bg-app-light"
                  style={{ width: `${personalProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
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
                    ? "Review Answers"
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
