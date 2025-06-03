"use client";

import { useState } from "react";
import ItemTagTable from "./ItemTagTable";
import StatusTable from "./StatusTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";

export default function ProjectTags() {
  const options = [
    "Backlog Tags",
    "Scrumboard Status",
    "Requirement Focus",
    "Requirement Type",
  ];

  const [selectedOption, setSelectedOption] = useState<string>(
    options[0] ?? "Backlog Tags",
  );

  const tagTypeMapping: Record<string, "BacklogTag" | "ReqFocus" | "ReqType"> =
    {
      "Backlog Tags": "BacklogTag",
      "Requirement Focus": "ReqFocus",
      "Requirement Type": "ReqType",
    };

  const currentTagType =
    selectedOption !== "Scrumboard Status"
      ? (tagTypeMapping[selectedOption] ?? "BacklogTag")
      : null;

  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Tags & Scrumboard</h1>
      <div className="mb-4">
        <SegmentedControl
          options={options}
          selectedOption={selectedOption}
          onChange={setSelectedOption}
          dontAnimateAlways
        />
      </div>
      <div>
        <div className="mb-6">
          {selectedOption !== "Scrumboard Status" ? (
            <ItemTagTable itemTagType={currentTagType!} />
          ) : (
            <StatusTable />
          )}
        </div>
      </div>
    </div>
  );
}
