"use client";

import React from "react";
import HappinessForm from "./HappinessForm";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import ProfilePicture from "~/app/_components/ProfilePicture";

export default function ProjectSprintReview() {
  const { user } = useFirebaseAuth();
  const teamProgress = 90;
  const personalProgress = 100;
  const userName = user?.displayName ?? "Usuario";

  return (
    <div className="flex h-full flex-col justify-start overflow-hidden">
      <h1 className="text-3xl font-semibold">Sprint Review</h1>
      <p className="mb-5 text-gray-600">
        Congratulations on finishing another sprint! Let&apos;s take a look at
        how it went.
      </p>

      <div className="flex h-[calc(100%-80px)] gap-6">
        <div className="flex h-full w-1/2 flex-col rounded-lg border border-app-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">Team Progress</h2>
          <div className="mb-6">
            <p className="mb-2 font-medium">90% of user stories completed</p>
            <div className="h-8 w-full overflow-hidden rounded-md bg-gray-200">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${teamProgress}%` }}
              />
            </div>
          </div>

          <h2 className="mb-4 text-2xl font-semibold">Personal Progress</h2>
          <div className="mb-6">
            <p className="mb-2 font-medium">100% of your tasks completed</p>
            <div className="h-8 w-full overflow-hidden rounded-md bg-gray-200">
              <div
                className="h-full bg-green-400"
                style={{ width: `${personalProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ProfilePicture
              user={user}
              className="h-16 w-16 min-w-16 text-xl"
              hideTooltip
            />
            <div>
              <p className="text-xl font-semibold">{userName}</p>
            </div>
          </div>
        </div>

        <div className="h-full w-1/2">
          <HappinessForm />
        </div>
      </div>
    </div>
  );
}
