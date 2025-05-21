"use client";
import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import ProfilePicture from "~/app/_components/ProfilePicture";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  SampleData,
  PerformanceChart,
} from "~/app/_components/charts/PerformanceChart";
import { cn } from "~/lib/utils";
import type { UserCol } from "~/lib/types/columnTypes";

export const MemberList = ({
  searchValue,
  projectId,
  // timeInterval,
  setSelectedMember,
  selectedMember,
}: {
  projectId: string;
  searchValue: string;
  // timeInterval: string;
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
        className="h-[calc(100vh-250px)] w-full overflow-hidden overflow-y-auto"
        data-cy="project-list"
      >
        {filteredMembers && filteredMembers?.length > 0 ? (
          filteredMembers?.map((member) => (
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
                pictureClassName="h-20 w-20 mx-5 my-auto text-2xl"
              />
              <div className="flex flex-col justify-start overflow-hidden pl-4 pr-4">
                <h3 className="my-auto w-[150px] truncate text-xl font-semibold">
                  {member.displayName}
                </h3>
              </div>
              <PerformanceChart
                data={SampleData}
                actions={false}
                className="ml-8"
              />

              {selectedMember?.id !== member.id && (
                <ArrowForwardIosIcon className="my-auto text-gray-500" />
              )}
            </li>
          ))
        ) : (
          <li className="flex h-full justify-start border-b-2">
            <div className="py-[20px]">
              <p className="text-gray-500">No members found.</p>

              {
                <p className="text-sm text-gray-500">
                  Try changing the search query.
                </p>
              }
            </div>
          </li>
        )}
      </ul>
    </div>
  );
};
