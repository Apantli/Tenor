"use client";
import { ProductivityCard } from "~/app/_components/cards/ProductivityCard";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useState } from "react";
import SearchBar from "~/app/_components/SearchBar";
import { useParams } from "next/navigation";
import { MemberDetailsCard } from "~/app/_components/cards/MemberdetailsCard";
import type { UserCol } from "~/lib/types/columnTypes";
import type { PerformanceTime } from "~/lib/types/zodFirebaseSchema";
import type z from "zod";

import { MemberList } from "~/app/_components/MemberList";

export default function ProjectPerformance() {
  const { projectId } = useParams();
  const projectIdString = projectId as string;
  const [section, setSection] =
    useState<z.infer<typeof PerformanceTime>>("Week");
  const [searchValue, setSearchValue] = useState("");

  const [selectedMember, setSelectedMember] = useState<UserCol | null>(null);

  return (
    <div className="flex h-full flex-1 flex-col gap-x-7 overflow-hidden pt-0 md:flex-row">
      <div className="flex w-[50vw] max-w-[50vw] shrink-0 flex-col items-baseline gap-3 pb-4">
        <div className="flex w-full flex-row justify-between">
          <h1 className="text-3xl font-semibold">Team Performance</h1>
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
          timePartition={section}
          setSelectedMember={setSelectedMember}
          selectedMember={selectedMember}
        />
      </div>
      <div className="w-[50vw]">
        {selectedMember ? (
          <MemberDetailsCard
            member={selectedMember}
            projectId={projectIdString}
            timeInterval={section}
            className="mx-20 my-auto"
            setSelectedMember={setSelectedMember}
          />
        ) : (
          <>
            <ProductivityCard
              projectId={projectIdString}
              time={section}
              className="h-[36vh]"
            />
          </>
        )}
      </div>
    </div>
  );
}
