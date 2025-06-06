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
import ProgressBar from "~/app/_components/ProgressBar";
import MoreInformation from "~/app/_components/helps/MoreInformation";

export default function ProjectSprintRetrospectivePage() {
  const { user } = useFirebaseAuth();
  const { projectId } = useParams();

  const [isFormCompleted, setIsFormCompleted] = useState(false);
  const [userClickedShowAnswers, setUserClickedShowAnswers] = useState(false);

  const { data: previousSprint, isLoading: loadingPrevSprint } =
    api.sprintRetrospectives.getPreviousSprint.useQuery({
      projectId: projectId as string,
    });

  const previousSprintId = previousSprint?.id ?? "";

  const { data: sprint, isLoading: loadingSprint } =
    api.sprints.getSprint.useQuery(
      {
        projectId: projectId as string,
        sprintId: previousSprintId,
      },
      {
        enabled: !!previousSprintId,
      },
    );

  const { data: sprintRetrospectiveId, isLoading: loadingRetrospectiveId } =
    api.sprintRetrospectives.getRetrospectiveId.useQuery(
      {
        projectId: projectId as string,
        sprintId: previousSprintId,
      },
      {
        enabled: !!previousSprintId,
      },
    );

  const { data: teamProgressData, isLoading: loadingTeamProgress } =
    api.sprintRetrospectives.getRetrospectiveTeamProgress.useQuery(
      {
        projectId: projectId as string,
        sprintId: previousSprintId,
      },
      {
        enabled: !!previousSprintId,
      },
    );

  const { data: personalProgressData, isLoading: loadingPersonalProgress } =
    api.sprintRetrospectives.getRetrospectivePersonalProgress.useQuery(
      {
        projectId: projectId as string,
        sprintId: previousSprintId,
        userId: user?.uid ?? "",
      },
      {
        enabled: !!previousSprintId && !!user?.uid,
      },
    );

  const sprintNumber = sprint?.number;
  const userName =
    user?.displayName ?? user?.email ?? "No name or email provided";

  if (
    loadingPrevSprint ||
    loadingSprint ||
    loadingRetrospectiveId ||
    loadingTeamProgress ||
    loadingPersonalProgress
  ) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  const showMessageOverlay = isFormCompleted && !userClickedShowAnswers;

  return (
    <div className="m-6 flex h-full flex-col p-4 md:pb-10">
      <div className="pb-4">
        <h1 className="text-3xl font-semibold">
          Retrospective for Sprint {sprintNumber && `${sprintNumber}`}
        </h1>
        <p className="mt-2 text-gray-600">
          Congratulations on finishing another sprint! Let&apos;s take a look at
          how it went.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-start overflow-y-auto pb-6">
        <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
          <div className="flex h-full w-full flex-col rounded-lg border border-app-border bg-white p-6 shadow-sm lg:w-1/2">
            <div className="flex-1 overflow-y-auto">
              <h2 className="mb-4 text-2xl font-semibold">Team Progress</h2>

              <div className="mb-6">
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
                    progressBarColor="#198A5F"
                    emptyBarColor="#CCCCCC"
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
                    emptyBarColor="#CCCCCC"
                    className="h-8"
                    compact={true}
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">Backlog Items</p>
                  <p className="text-sm text-gray-600">
                    {teamProgressData?.completedBacklogItems ?? 0} of{" "}
                    {teamProgressData?.totalBacklogItems ?? 0} completed
                  </p>
                </div>
                <div className="relative">
                  <ProgressBar
                    min={0}
                    max={teamProgressData?.totalBacklogItems ?? 100}
                    value={teamProgressData?.completedBacklogItems ?? 0}
                    progressBarColor="#13918A"
                    emptyBarColor="#CCCCCC"
                    className="h-8"
                    compact={true}
                  />
                </div>
              </div>

              <h2 className="mb-4 text-2xl font-semibold">Personal Progress</h2>
              <div className="mb-6 flex items-center gap-6">
                <ProfilePicture
                  user={user}
                  className="h-10 w-10 min-w-10 text-xl"
                  hideTooltip
                />
                <div>
                  <p className="text-l font-semibold">{userName}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">Tasks Assigned</p>
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
                    progressBarColor="#198A5F"
                    emptyBarColor="#CCCCCC"
                    className="h-8"
                    compact={true}
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">Story Points Assigned</p>
                  <p className="text-sm text-gray-600">
                    {personalProgressData?.completedAssignedStoryPoints ?? 0} of{" "}
                    {personalProgressData?.totalAssignedStoryPoints ?? 0}{" "}
                    completed
                  </p>
                </div>
                <div className="relative">
                  <ProgressBar
                    min={0}
                    max={personalProgressData?.totalAssignedStoryPoints ?? 100}
                    value={
                      personalProgressData?.completedAssignedStoryPoints ?? 0
                    }
                    progressBarColor="#88BB87"
                    emptyBarColor="#CCCCCC"
                    className="h-8"
                    compact={true}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex gap-2">
                    <p className="font-medium">Sprint Contribution</p>
                    <MoreInformation
                      label="This percentage shows how much of the sprint's total story points you personally completed."
                      size="small"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {personalProgressData?.completedAssignedStoryPoints ?? 0} of{" "}
                    {teamProgressData?.totalStoryPoints ?? 0} completed
                  </p>
                </div>
                <div className="relative">
                  <ProgressBar
                    min={0}
                    max={teamProgressData?.totalStoryPoints ?? 100}
                    value={
                      personalProgressData?.completedAssignedStoryPoints ?? 0
                    }
                    progressBarColor="#13918A"
                    emptyBarColor="#CCCCCC"
                    className="h-8"
                    compact={true}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-full w-full lg:w-1/2">
            <HappinessForm
              sprintRetrospectiveId={sprintRetrospectiveId}
              onCompletionChange={setIsFormCompleted}
              retrospectiveEndDate={previousSprint?.endDate}
            />

            {showMessageOverlay && (
              <div className="absolute bottom-0 left-0 right-0 top-0 z-10 flex flex-col items-center justify-center rounded-lg border border-app-border bg-white bg-opacity-75 p-4 text-center backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-center">
                  <CheckIcon sx={{ fontSize: 60 }} />
                </div>
                <p className="mb-4 text-xl font-semibold">
                  You have completed your happiness survey.
                </p>
                <PrimaryButton onClick={() => setUserClickedShowAnswers(true)}>
                  Review answers
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
