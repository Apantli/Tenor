"use client";
import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { cn } from "~/lib/helpers/utils";
import { SentimentIcon } from "~/app/(logged)/project/[projectId]/performance/MemberDetailsCard";

interface SentimentData {
  projectId: string;
  className?: string;
}

export const SentimentCard = ({ projectId, className }: SentimentData) => {
  const {
    data: usersSentiment,
    isLoading,
    error,
  } = api.performance.getUsersSentiment.useQuery(
    {
      projectId: projectId,
    },
    { retry: 0, refetchOnWindowFocus: true },
  );

  // Count happiness values by ranges
  const happinessCounts = usersSentiment?.reduce(
    (acc, user) => {
      const happiness = user.happiness;
      if (happiness === null || happiness === undefined) {
        acc.nulls++;
      } else if (happiness >= 0 && happiness < 5) {
        acc.negative++;
      } else if (happiness >= 5 && happiness < 7) {
        acc.neutral++;
      } else if (happiness >= 7 && happiness <= 10) {
        acc.positive++;
      }
      return acc;
    },
    { negative: 0, neutral: 0, positive: 0, nulls: 0 },
  ) ?? { negative: 0, neutral: 0, positive: 0, nulls: 0 };

  // Calculate total count and proportional widths
  const totalCount =
    happinessCounts.negative +
    happinessCounts.neutral +
    happinessCounts.positive +
    happinessCounts.nulls;
  const negativeWidth =
    totalCount > 0 ? (happinessCounts.negative / totalCount) * 100 : 0;
  const neutralWidth =
    totalCount > 0 ? (happinessCounts.neutral / totalCount) * 100 : 0;
  const positiveWidth =
    totalCount > 0 ? (happinessCounts.positive / totalCount) * 100 : 0;
  const nullsWidth =
    totalCount > 0 ? (happinessCounts.nulls / totalCount) * 100 : 0;

  return (
    <div
      className={cn(
        "mt-1 box-content flex flex-col overflow-y-auto rounded-md border-2 p-4",
        className,
      )}
    >
      <h1 className="mx-6 mb-4 text-2xl font-bold">Happiness</h1>
      {isLoading ? (
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      ) : (
        <div className="flex h-full flex-col content-center items-center justify-center gap-3 rounded-lg bg-white p-4">
          {error?.message ? (
            <p className="text-xl text-gray-500">{error.message}</p>
          ) : (
            <>
              <div className="flex w-full flex-row justify-center gap-3">
                {negativeWidth > 0 && (
                  <div
                    className="h-16 rounded-3xl bg-[#e76478] 2xl:h-24"
                    style={{ width: `${Math.max(negativeWidth, 5)}%` }}
                  ></div>
                )}
                {neutralWidth > 0 && (
                  <div
                    className="h-16 rounded-3xl bg-[#f1db30] 2xl:h-24"
                    style={{ width: `${Math.max(neutralWidth, 5)}%` }}
                  ></div>
                )}
                {positiveWidth > 0 && (
                  <div
                    className="h-16 rounded-3xl bg-app-green 2xl:h-24"
                    style={{ width: `${Math.max(positiveWidth, 5)}%` }}
                  ></div>
                )}
                {nullsWidth > 0 && (
                  <div
                    className="h-16 rounded-3xl bg-gray-400 2xl:h-24"
                    style={{ width: `${Math.max(nullsWidth, 5)}%` }}
                  ></div>
                )}
              </div>

              <div className="flex w-full justify-around">
                <SentimentLabel
                  label="Negative"
                  count={happinessCounts.negative}
                  happiness={1}
                />
                <SentimentLabel
                  label="Neutral"
                  count={happinessCounts.neutral}
                  happiness={5}
                />
                <SentimentLabel
                  label="Positive"
                  count={happinessCounts.positive}
                  happiness={10}
                />
                <SentimentLabel
                  label="No Data"
                  count={happinessCounts.nulls}
                  happiness={0}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const SentimentLabel = ({
  label,
  count,
  happiness,
}: {
  label: string;
  count: number;
  happiness: number;
}) => {
  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex flex-col">
        <h2 className="text-lg text-gray-500">{label}</h2>
        <div className="flex flex-row gap-4 text-3xl">
          <SentimentIcon sentiment={happiness} isLoading={false} />
          <p className="text-lg font-semibold">{count}</p>
        </div>
      </div>
    </div>
  );
};
