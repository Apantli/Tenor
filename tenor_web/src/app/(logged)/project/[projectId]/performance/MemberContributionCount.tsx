import { type UserCol } from "~/lib/types/columnTypes";
import { api } from "~/trpc/react";
import HelpIcon from "@mui/icons-material/Help";
import { cn } from "~/lib/helpers/utils";

export const MemberContributionCount = ({
  projectId,
  member,
  time,
  className = "",
}: {
  projectId: string;
  time: string;
  member: UserCol;
  className?: string;
}) => {
  const { data, error, isLoading } =
    api.performance.getUserContributionCount.useQuery({
      projectId: projectId,
      userId: member.id,
      time: time,
    });

  const contributionString = isLoading
    ? "Loading..."
    : error
      ? error.message
      : (data?.toString() ?? "0");

  return (
    <>
      <HelpIcon
        className={cn("ml-[3px] mt-3 text-gray-500", className)}
        data-tooltip-id="tooltip"
        data-tooltip-content={`Contribution count during the last ${time.toLocaleLowerCase()}: ${contributionString}`}
        data-tooltip-place="top-start"
        style={{ width: "15px" }}
      />
    </>
  );
};
