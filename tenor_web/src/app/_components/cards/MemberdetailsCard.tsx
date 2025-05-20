import ProfilePicture from "~/app/_components/ProfilePicture";

import {
  ContributionPieChart,
  ContributionLegend,
  SampleContributionData,
} from "~/app/_components/charts/ContributionPieChart";
import CrossIcon from "@mui/icons-material/Close";
import type { UserCol } from "~/lib/types/columnTypes";

export const MemberDetailsCard = ({
  member,
  // timeInterval,
  setSelectedMember,
}: {
  member: UserCol;
  // timeInterval: string;
  setSelectedMember: (member: UserCol | null) => void;
}) => {
  return (
    <div className="flex w-[700px] min-w-[600px] flex-col gap-y-4 rounded-md border-2 p-4">
      <CrossIcon
        onClick={() => setSelectedMember(null)}
        className="ml-auto text-gray-500"
        fontSize="large"
      />
      <div className="flex flex-row gap-3">
        <ProfilePicture
          user={member}
          hideTooltip
          pictureClassName="h-32 w-32 ml-5 my-auto"
        />
        <div className="my-auto flex flex-col justify-start overflow-hidden pl-4 pr-4">
          <h3 className="my-[7px] max-w-[500px] truncate text-2xl font-semibold">
            {member.displayName}
          </h3>
          <p className="line-clamp-2 text-xl capitalize text-gray-500">
            {member.roleId == "none" ? "No role" : member.roleId}
          </p>
        </div>
      </div>

      <div className="mx-8 flex flex-col gap-8 pt-4">
        <p className="mt-2 text-xl">
          <strong>Email:</strong> {member.email}
        </p>
        <h4 className="mb-4 text-xl font-bold">Contribution overview</h4>
        <div className="flex flex-row items-center gap-8">
          <ContributionPieChart data={SampleContributionData} />
          <ContributionLegend />
        </div>
      </div>
    </div>
  );
};
