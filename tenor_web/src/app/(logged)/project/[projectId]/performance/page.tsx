"use client";
import { ProductivityCard } from "~/app/_components/cards/ProductivityCard";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useState } from "react";
import SearchBar from "~/app/_components/SearchBar";
import { api } from "~/trpc/react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useParams } from "next/navigation";
import ProfilePicture from "~/app/_components/ProfilePicture";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  SampleData,
  PerformanceChart,
} from "~/app/_components/charts/PerformanceChart";
import { MemberDetailsCard } from "~/app/_components/cards/MemberdetailsCard";
import { twMerge } from "tailwind-merge";
import type { UserCol } from "~/lib/types/columnTypes";
import type { PerformanceTime } from "~/lib/types/zodFirebaseSchema";
import type z from "zod";

export default function ProjectPerformance() {
  const { projectId } = useParams();
  const projectIdString = projectId as string;
  const [section, setSection] =
    useState<z.infer<typeof PerformanceTime>>("Week");
  const [searchValue, setSearchValue] = useState("");

  const [selectedMember, setSelectedMember] = useState<UserCol | null>(null);

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-x-32 overflow-hidden pt-0 md:flex-row">
      <div className="flex w-[50vw] flex-col items-baseline gap-3 pb-4">
        <div className="flex w-full flex-row justify-between">
          <h1 className="grow-[1] text-3xl font-semibold">Team Performance</h1>
          <div className="min-w-[300px]">
            <SegmentedControl
              options={["Week", "Month", "Sprint"]}
              selectedOption={section}
              onChange={(value) => {
                setSection(value as z.infer<typeof PerformanceTime>);
                localStorage.setItem("performance-section", value);
              }}
            />
          </div>
        </div>
        <SearchBar
          placeholder="Find a team member..."
          searchValue={searchValue}
          handleUpdateSearch={(e) => setSearchValue(e.target.value)}
        />
        <MemberList
          projectId={projectIdString}
          searchValue={searchValue}
          // timeInterval={section}
          setSelectedMember={setSelectedMember}
          selectedMember={selectedMember}
        />
      </div>
      {selectedMember ? (
        <MemberDetailsCard
          member={selectedMember}
          // timeInterval={section}
          setSelectedMember={setSelectedMember}
        />
      ) : (
        <ProductivityCard projectId={projectIdString} time={section} />
      )}
    </div>
  );
}

const MemberList = ({
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
  const {
    data: members,
    isLoading,
    error,
  } = api.users.getUserTable.useQuery({
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

  if (error?.data?.code == "UNAUTHORIZED") {
    return <p>Log in to view this information</p>;
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
              className={twMerge(
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
                pictureClassName="h-20 w-20 mx-5 my-auto"
              />
              <div className="flex flex-col justify-start overflow-hidden pl-4 pr-4">
                <h3 className="my-auto w-[150px] truncate text-xl font-semibold">
                  {member.displayName}
                </h3>
                {/* <p className="line-clamp-2 text-base">{member.email}</p> */}
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
