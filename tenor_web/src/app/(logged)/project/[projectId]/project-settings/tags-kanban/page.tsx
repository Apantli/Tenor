"use client";

import { useState } from "react";
import ItemTagTable from "./ItemTagTable";
import StatusTable from "./StatusTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";

export default function ProjectTags() {
  const options = [
    "Backlog Tags",
    "Requirement Focus",
    "Requirement Type",
    "Kanban Status",
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
    selectedOption !== "Kanban Status"
      ? (tagTypeMapping[selectedOption] ?? "BacklogTag")
      : null;

  const tagTypeTitles: Record<string, string> = {
    BacklogTag: "Backlog item tags",
    ReqFocus: "Requirement focus areas",
    ReqType: "Requirement types",
    KanbanStatus: "Kanban status",
  };

  const getCurrentTitle = () => {
    if (selectedOption === "Kanban Status") {
      return "Kanban status";
    }
    return tagTypeTitles[currentTagType as keyof typeof tagTypeTitles];
  };

  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Tags & Kanban</h1>

      <div className="mb-4">
        <SegmentedControl
          options={options}
          selectedOption={selectedOption}
          onChange={setSelectedOption}
        />
      </div>

      <div>
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-medium">{getCurrentTitle()}</h2>

          {selectedOption !== "Kanban Status" ? (
            <ItemTagTable itemTagType={currentTagType!} />
          ) : (
            <StatusTable />
          )}
        </div>
      </div>
    </div>
  );
}
