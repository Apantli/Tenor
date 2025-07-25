"use client";
import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import ProfilePicture from "~/app/_components/ProfilePicture";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { cn } from "~/lib/helpers/utils";
import type { UserCol } from "~/lib/types/columnTypes";
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

export const MemberList = ({
  searchValue,
  projectId,
  timePartition,
  setSelectedMember,
  selectedMember,
}: {
  projectId: string;
  searchValue: string;
  timePartition: string;
  setSelectedMember: (member: UserCol | null) => void;
  selectedMember: UserCol | null;
}) => {
  const { data: members, isLoading } = api.users.getTeamMembers.useQuery({
    projectId: projectId,
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  const filteredMembers = members?.filter((member) => {
    return (
      member.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
      member.email.toLowerCase().includes(searchValue.toLowerCase())
    );
  });

  return (
    <div className="mr-10 w-full">
      <ul
        className="h-fit max-h-[calc(100vh-250px)] w-full overflow-hidden overflow-y-auto pb-10 xl:h-[calc(100vh-250px)]"
        data-cy="member-list"
      >
        {filteredMembers && filteredMembers?.length > 0 ? (
          filteredMembers?.map((member) => (
            <MemberItem
              key={member.id}
              member={member}
              time={timePartition}
              projectId={projectId}
              selectedMember={selectedMember}
              setSelectedMember={setSelectedMember}
            />
          ))
        ) : (
          <li className="flex h-full justify-start border-b-2">
            <div className="py-[20px]">
              <p className="text-gray-500">No members found.</p>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
};

const MemberItem = ({
  projectId,
  member,
  selectedMember,
  setSelectedMember,
  time,
}: {
  projectId: string;
  time: string;
  member: UserCol;
  selectedMember: UserCol | null;
  setSelectedMember: (member: UserCol | null) => void;
}) => {
  const { data } = api.performance.getUserContributions.useQuery({
    projectId: projectId,
    userId: member.id,
    time: time,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const formattedData = data?.map((d) => ({
    x: d.date,
    y: d.count,
  }));

  // If there's only one data point, add another point one day before so that the chart isn't empty
  if (formattedData?.length === 1 && formattedData[0]) {
    const prevDate = new Date(formattedData[0].x);
    prevDate.setDate(prevDate.getDate() - 1);
    formattedData.push({
      x: prevDate,
      y: 0,
    });
  }

  return (
    <li
      className={cn(
        "flex w-full flex-row justify-start border-b-2 py-[16px] pr-8 hover:cursor-pointer",
        selectedMember?.id === member.id ? "bg-gray-100" : "",
      )}
      key={member.id}
      onClick={() => {
        if (selectedMember?.id === member.id) {
          setSelectedMember(null);
        } else {
          setSelectedMember(member);
        }
      }}
    >
      <ProfilePicture
        user={member}
        hideTooltip
        size={80}
        pictureClassName="mx-5 my-auto"
      />
      <h3
        className={cn(
          "my-auto min-w-[100px] truncate text-xl font-semibold capitalize xl:min-w-[200px]",
          {
            "w-full": !formattedData || formattedData?.length === 0,
          },
        )}
      >
        {member.displayName}
      </h3>

      <DynamicPerformanceChart data={formattedData ?? []} className="" />
      <ArrowForwardIosIcon
        className={cn("my-auto ml-auto hidden text-gray-500", {
          invisible: selectedMember?.id === member.id,
        })}
      />
    </li>
  );
};
