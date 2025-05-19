"use client";
import { api } from "~/trpc/react";
import type { PerformanceTime } from "~/lib/types/zodFirebaseSchema";
import type z from "zod";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { timestampToDate } from "~/utils/helpers/parsers";

interface PerformanceData {
  time: z.infer<typeof PerformanceTime>;
  projectId: string;
}

export const ProductivityCard = ({ projectId, time }: PerformanceData) => {
  const {
    data: stats,
    isLoading,
    // error,
  } = api.performance.getProductivity.useQuery({
    projectId: projectId,
    time: time,
  });

  const radius = 70;

  const r1 = radius + 10; // Radius for user stories
  const r2 = radius - 10; // Radius for issues
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;

  console.log("ProductivityCard stats.fetchDate", stats?.fetchDate);

  const userStoriesPercent =
    stats?.userStoryTotal === 0
      ? 100
      : Math.round(
          ((stats?.userStoryCompleted ?? 0) / (stats?.userStoryTotal ?? 1)) *
            100 *
            10,
        ) / 10;
  const issuesPercent =
    stats?.issueTotal === 0
      ? 100
      : Math.round(
          ((stats?.issueCompleted ?? 0) / (stats?.issueTotal ?? 1)) * 100 * 10,
        ) / 10;

  const userStoriesStrokeDasharray = `${(userStoriesPercent / 100) * c1} ${c1}`;
  const issuesStrokeDasharray = `${(issuesPercent / 100) * c2} ${c2}`;

  console.log("stats", stats);

  return (
    <div className="box-content flex h-[400px] w-[700px] min-w-[600px] flex-col rounded-md border-2 p-4">
      <h1 className="mb-6 border-b-2 pb-4 text-3xl font-bold">Productivity</h1>
      {isLoading ? (
        <div className="flex flex-row gap-3 align-middle">
          <LoadingSpinner />
          <p className="text-lg font-semibold">Loading project statistics...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 rounded-lg bg-white p-4 md:flex-row">
          <div className="relative h-64 w-64">
            {/* Background circles */}
            <svg
              className="absolute left-0 top-0 h-full w-full"
              viewBox="0 0 200 200"
            >
              {/* Outer light gray circle (background) */}
              <circle
                cx="100"
                cy="100"
                r={radius + 10}
                fill="none"
                stroke="#f0f0f4"
                strokeWidth="10"
              />

              {/* Inner light gray circle (background) */}
              <circle
                cx="100"
                cy="100"
                r={radius - 10}
                fill="none"
                stroke="#f0f0f4"
                strokeWidth="10"
              />

              {/* Outer circle - User Stories progress */}
              <circle
                cx="100"
                cy="100"
                r={radius + 10}
                fill="none"
                stroke="#88BB87"
                strokeWidth="10"
                strokeDasharray={userStoriesStrokeDasharray}
                strokeDashoffset={0}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />

              {/* Inner circle - Issues progress */}
              <circle
                cx="100"
                cy="100"
                r={radius - 10}
                fill="none"
                stroke="#184723"
                strokeWidth="10"
                strokeDasharray={issuesStrokeDasharray}
                strokeDashoffset={0}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </svg>
          </div>

          <div className="flex flex-col">
            <h2 className="mb-6 text-xl font-semibold">Completed</h2>

            <div className="flex flex-col gap-4">
              {/* User Stories */}
              <div className="flex items-center gap-3 text-gray-500">
                <div className="h-4 w-4 rounded-full bg-[#88BB87]"></div>
                <span className="text-lg">
                  User Stories {userStoriesPercent}%
                </span>
              </div>

              {/* Issues */}
              <div className="flex items-center gap-3 text-gray-500">
                <div className="h-4 w-4 rounded-full bg-[#184723]"></div>
                <span className="text-lg">Issues {issuesPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto text-gray-500">
        {stats?.fetchDate &&
          `Updated ${timestampToDate(stats.fetchDate).toLocaleString()}`}
      </div>
    </div>
  );
};
