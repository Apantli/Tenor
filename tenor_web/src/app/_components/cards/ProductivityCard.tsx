interface PerformanceData {
  userStories: {
    completed: number;
    total: number;
  };
  issues: {
    completed: number;
    total: number;
  };
  lastUpdated: string;
  sprint: number;
}

export const ProductivityCard = ({
  userStories,
  issues,
  lastUpdated,
  sprint,
}: PerformanceData) => {
  const radius = 70;

  const r1 = radius + 10; // Radius for user stories
  const r2 = radius - 10; // Radius for issues
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;

  const userStoriesPercent =
    Math.round((userStories.completed / userStories.total) * 100 * 10) / 10;
  const issuesPercent =
    Math.round((issues.completed / issues.total) * 100 * 10) / 10;

  const userStoriesStrokeDasharray = `${(userStoriesPercent / 100) * c1} ${c1}`;
  const issuesStrokeDasharray = `${(issuesPercent / 100) * c2} ${c2}`;

  return (
    <div className="flex h-full flex-col rounded-md border-2 p-4">
      <h1 className="mb-6 border-b-2 pb-4 text-3xl font-bold">Productivity</h1>

      <div className="flex flex-col items-center gap-8 rounded-lg bg-white p-8 md:flex-row">
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
              stroke="#9eca9e"
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
              stroke="#144814"
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
              <div className="h-4 w-4 rounded-full bg-[#9eca9e]"></div>
              <span className="text-lg">
                User Stories {userStoriesPercent}%
              </span>
            </div>

            {/* Issues */}
            <div className="flex items-center gap-3 text-gray-500">
              <div className="h-4 w-4 rounded-full bg-[#144814]"></div>
              <span className="text-lg">Issues {issuesPercent}%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 text-gray-500">
        Updated {lastUpdated} - Sprint {sprint}
      </div>
    </div>
  );
};
