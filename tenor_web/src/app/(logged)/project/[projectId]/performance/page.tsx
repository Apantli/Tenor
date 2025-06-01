"use client";
import { ProductivityCard } from "~/app/_components/cards/ProductivityCard";
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
    <div className="m-6 flex-1 p-4">
      <div className="flex h-full w-full flex-col gap-x-16 md:flex-row">
        <div className="flex w-[55vw] flex-col items-baseline gap-3 pb-4">
          <div className="flex w-full flex-row justify-between">
            <h1 className="grow-[1] text-3xl font-semibold">
              Team Performance
            </h1>
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
          {/* FIXME: pass timeInterval and use it to actually compute the team performance */}
          <MemberList
            projectId={projectIdString}
            searchValue={searchValue}
            // timeInterval={section}
            setSelectedMember={setSelectedMember}
            selectedMember={selectedMember}
          />
        </div>
        <div className="flex-1">
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
      </div>
    </div>
  );
}
