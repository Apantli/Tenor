"use client";

import React from "react";
import HappinessForm from "./HappinessForm";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import ProfilePicture from "~/app/_components/ProfilePicture";
import {
  SampleData,
  PerformanceChart,
} from "~/app/_components/charts/PerformanceChart";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";

export default function ProjectSprintReviewPage() {
  const { user } = useFirebaseAuth();
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: previousSprint, isLoading: loadingprevSprint } =
    api.sprintReviews.getPreviousSprint.useQuery({
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

  const { data: sprintReviewId, isLoading: loadingReviewId } =
    api.sprintReviews.getReviewId.useQuery(
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

  if (loadingprevSprint || loadingSprint || loadingReviewId) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-start overflow-y-auto">
      <h1 className="text-3xl font-semibold">
        Sprint Review for Sprint {sprintNumber && `${sprintNumber}`}
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
            <PerformanceChart
              data={SampleData}
              actions={false}
              className="ml-8"
            />
          </div>
        </div>

        <div className="h-full w-full lg:w-1/2">
          <HappinessForm sprintReviewId={sprintReviewId} />
        </div>
      </div>
    </div>
  );
}
