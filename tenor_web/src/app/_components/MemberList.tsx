"use client";
import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import ProfilePicture from "~/app/_components/ProfilePicture";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { PerformanceChart } from "~/app/_components/charts/PerformanceChart";
import { cn } from "~/lib/utils";
import type { UserCol } from "~/lib/types/columnTypes";

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
  const { data: members, isLoading } = api.users.getUserTable.useQuery({
    projectId: projectId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-row gap-3 align-middle">
        <LoadingSpinner />
        <p className="text-lg font-semibold">Loading team members...</p>
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
        className="h-[calc(100vh-250px)] w-full overflow-hidden overflow-y-auto pb-5"
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
              <p className="text-sm text-gray-500">
                Try changing the search query.
              </p>
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
      y: formattedData[0].y,
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
        pictureClassName="min-h-20 min-w-20 h-20 w-20 mx-5 my-auto text-4xl"
      />
      <div className="flex flex-col justify-start overflow-hidden pl-4 pr-4">
        <h3 className="my-auto w-[250px] truncate text-xl font-semibold capitalize">
          {member.displayName}
        </h3>
      </div>

      <PerformanceChart data={formattedData ?? []} className="" />
      <ArrowForwardIosIcon
        className={cn("my-auto ml-auto hidden text-gray-500", {
          invisible: selectedMember?.id === member.id,
        })}
      />
    </li>
  );
};
