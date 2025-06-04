"use client";
import { ProductivityCard } from "~/app/_components/cards/ProductivityCard";
import { SentimentCard } from "~/app/_components/cards/SentimentCard";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useState } from "react";
import SearchBar from "~/app/_components/inputs/search/SearchBar";
import { useParams } from "next/navigation";
import { MemberDetailsCard } from "~/app/(logged)/project/[projectId]/performance/MemberDetailsCard";
import type { UserCol } from "~/lib/types/columnTypes";
import type { PerformanceTime } from "~/lib/types/zodFirebaseSchema";
import type z from "zod";
import { MemberList } from "~/app/(logged)/project/[projectId]/performance/MemberList";

export default function ProjectPerformance() {
  const { projectId } = useParams();
  const projectIdString = projectId as string;
  const [section, setSection] =
    useState<z.infer<typeof PerformanceTime>>("Week");
  const [searchValue, setSearchValue] = useState("");

  const [selectedMember, setSelectedMember] = useState<UserCol | null>(null);

  return (
    <div className="m-6 flex-1 overflow-y-auto p-4">
      <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4 lg:flex-row lg:gap-16 xl:overflow-hidden">
        <div className="flex w-full flex-col items-baseline gap-3 pb-4 lg:w-[55%] lg:min-w-0 lg:flex-shrink">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Team Performance
            </h1>
            <div className="w-full min-w-0 sm:w-auto sm:min-w-[280px] lg:min-w-[300px]">
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
            timePartition={section}
            setSelectedMember={setSelectedMember}
            selectedMember={selectedMember}
          />
        </div>
        <div className="mx-auto w-full lg:w-[40%]">
          {selectedMember ? (
            <MemberDetailsCard
              member={selectedMember}
              projectId={projectIdString}
              timeInterval={section}
              className="my-auto mt-1 pb-4"
              setSelectedMember={setSelectedMember}
            />
          ) : (
            <>
              <ProductivityCard
                projectId={projectIdString}
                time={section}
                className="h-[40%] max-h-[40%]"
              />
              <SentimentCard
                projectId={projectIdString}
                className="mt-4 h-[40%] max-h-[40%]"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
