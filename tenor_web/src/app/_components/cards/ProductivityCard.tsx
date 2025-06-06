"use client";
import { api } from "~/trpc/react";
import type { PerformanceTime } from "~/lib/types/zodFirebaseSchema";
import type z from "zod";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { cn } from "~/lib/helpers/utils";
interface PerformanceData {
  time: z.infer<typeof PerformanceTime>;
  projectId: string;
  className?: string;
}

export const ProductivityCard = ({
  projectId,
  time,
  className,
}: PerformanceData) => {
  const {
    data: stats,
    isLoading,
    error,
  } = api.performance.getProductivity.useQuery(
    {
      projectId: projectId,
      time: time,
    },
    { retry: 0, refetchOnWindowFocus: "always", staleTime: 0 },
  );

  const radius = 70;

  const r1 = radius + 10; // Radius for user stories
  const r2 = radius - 10; // Radius for issues
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;

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
  return (
    <div
      className={cn(
        "mt-1 box-content flex flex-col overflow-y-auto rounded-md border-2 p-4",
        className,
      )}
    >
      <h1 className="mx-6 text-2xl font-bold">Productivity</h1>
      {isLoading ? (
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      ) : (
        <div className="flex h-full flex-row items-center justify-center gap-8 rounded-lg bg-white p-4">
          {error?.message ? (
            <p className="text-xl text-gray-500">{error.message}</p>
          ) : (
            <div className="relative h-full w-[50%]">
              {/* Background circles */}
              <svg
                className="absolute left-0 top-0 h-full w-full"
                viewBox="0 0 200 200"
              >
                {/* User Stories background */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius + 10}
                  fill="none"
                  stroke="#f0f0f4"
                  strokeWidth="10"
                />

                {/* Issues background */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius - 10}
                  fill="none"
                  stroke="#f0f0f4"
                  strokeWidth="10"
                />

                {/* User Stories */}
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

                {/* Issues */}
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
          )}

          {!error && (
            <div className="flex h-full flex-col">
              <h2 className="mb-6 text-xl font-semibold">Completed</h2>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="h-4 w-4 rounded-full bg-[#88BB87]"></div>
                  <span className="max-w-30 line-clamp-2 text-ellipsis text-lg">
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
          )}
        </div>
      )}
    </div>
  );
};
