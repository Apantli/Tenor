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

  const { data: teamProgressData } =
    api.sprintRetrospectives.getRetrospectiveTeamProgess.useQuery(
      {
        projectId: projectId,
        sprintId: previousSprintId,
      },
      {
        enabled: !!previousSprintId,
      },
    );

  const sprintNumber = sprint?.number;
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
    <div className="flex h-full flex-col">
      <header className="px-6 pb-4 pt-6">
        <h1 className="mb-2 text-3xl font-semibold">
          Sprint Retrospective for Sprint {sprintNumber && `${sprintNumber}`}
        </h1>
        <p className="text-gray-600">
          Congratulations on finishing another sprint! Let&apos;s take a look at
          how it went.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col rounded-lg border border-app-border bg-white p-6 shadow-sm">
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">Team Progress</h2>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">User Stories</p>
                    <p className="text-sm text-gray-600">
                      {teamProgressData?.completedUserStories ?? 0} of{" "}
                      {teamProgressData?.totalUserStories ?? 100} completed
                    </p>
                  </div>
                  <ProgressBar
                    min={0}
                    max={teamProgressData?.totalUserStories ?? 100}
                    value={teamProgressData?.completedUserStories ?? 0}
                    progressBarColor="#15734F"
                    emptyBarColor="#DDDDDD"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">Issues</p>
                    <p className="text-sm text-gray-600">
                      {teamProgressData?.completedIssues ?? 0} of{" "}
                      {teamProgressData?.totalIssues ?? 100} completed
                    </p>
                  </div>
                  <ProgressBar
                    min={0}
                    max={teamProgressData?.totalIssues ?? 100}
                    value={teamProgressData?.completedIssues ?? 0}
                    progressBarColor="#88BB87"
                    emptyBarColor="#DDDDDD"
                  />
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">Personal Progress</h2>

              <div className="mb-6">
                <p className="mb-2 font-medium">100% of your tasks completed</p>
                <div className="h-8 w-full overflow-hidden rounded-md bg-gray-200">
                  <div
                    className="h-full bg-app-light transition-all duration-300"
                    style={{ width: `${personalProgress}%` }}
                  />
                </div>
              </div>

              <div className="mb-6 flex items-center gap-4">
                <ProfilePicture
                  user={user}
                  className="h-16 w-16 text-xl"
                  hideTooltip
                />
                <div>
                  <p className="text-xl font-semibold">{userName}</p>
                </div>
              </div>
            </section>

            <div className="min-h-[200px] flex-1">
              <DynamicPerformanceChart className="h-full" />
            </div>
          </div>

          <div className="relative overflow-hidden">
            <HappinessForm
              sprintRetrospectiveId={sprintRetrospectiveId}
              onAnsweredCountChange={setAnsweredQuestionsCount}
            />

            {showMessageOverlay && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-8 backdrop-blur-sm">
                <div className="max-w-md text-center">
                  <div className="mb-6">
                    {notFinishedYet ? (
                      <QuestionMarkIcon
                        sx={{ fontSize: 80 }}
                        className="mx-auto text-gray-400"
                      />
                    ) : (
                      <CheckIcon
                        sx={{ fontSize: 80 }}
                        className="mx-auto text-green-500"
                      />
                    )}
                  </div>

                  <p className="mb-6 text-xl font-semibold">
                    You have completed {answeredQuestionsCount}/3 answers for
                    your happiness survey.
                  </p>

                  <PrimaryButton
                    onClick={() => setUserClickedShowAnswers(true)}
                    className="w-full sm:w-auto"
                  >
                    {answeredQuestionsCount === 3
                      ? "Retrospective Answers"
                      : "Show Answers"}
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
