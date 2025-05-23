"use client";

import Dropdown, { DropdownItem } from "~/app/_components/Dropdown";
import TuneIcon from "@mui/icons-material/Tune";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
// import { Checkbox } from "@mui/material";
// import ProfilePicture from "~/app/_components/ProfilePicture";
import { UserPicker } from "~/app/_components/specific-pickers/UserPicker";
import { useState } from "react";
import { cn } from "~/lib/utils";
import PillComponent from "~/app/_components/PillComponent";
// import { UserPreview } from "~/lib/types/detailSchemas";

export interface RegexItem {
  label: string;
  type: "assignee" | "size" | "tag" | "status" | "priority" | "operator";
}

const regexToColor = (regex: RegexItem) => {
  switch (regex.type) {
    case "assignee":
      return "bg-blue-200";
    case "size":
      return "bg-green-200";
    case "tag":
      return "bg-yellow-200";
    case "status":
      return "bg-red-200";
    case "priority":
      return "bg-purple-200";
    case "operator":
      return "bg-gray-200";
  }
};

interface Props {
  regex?: RegexItem[];
  setRegex?: (regex: RegexItem[]) => void;
}

export default function AdvancedSearch({}: Props) {
  // GENERAL
  const { projectId } = useParams();

  const { data: users } = api.users.getUsers.useQuery({
    projectId: projectId as string,
  });

  // const regex: RegexItem[] = [];
  const [regex, setRegex] = useState<RegexItem[]>([]);

  return (
    <Dropdown label={<TuneIcon />} close={false}>
      {/* Assignee section */}
      <DropdownItem>
        <div className="flex items-center">
          <h1 className="text-l font-semibold">Regex</h1>
        </div>
      </DropdownItem>
      <DropdownItem>
        <div className="h-32">
          {regex.map((item) => (
            <div key={item.label} className="flex items-center">
              <span
                className={cn(
                  "text-gray-60 mr-2 rounded-full px-3 py-1",
                  regexToColor(item),
                )}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </DropdownItem>
      {/* Asignee Picker */}
      {users && (
        <DropdownItem>
          <UserPicker
            close={false}
            options={users}
            onChange={(user) => {
              if (user) {
                setRegex((prev) => [
                  ...prev,
                  { label: user.displayName, type: "assignee" },
                ]);
              }
            }}
          />
        </DropdownItem>
      )}
      {/* Operator Picker */}

      <DropdownItem>
        <PillComponent
          allTags={[
            { id: "1", name: "AND", color: "bg-green-200", deleted: false },
            { id: "2", name: "OR", color: "bg-red-200", deleted: false },
          ]}
          callBack={(tag) => {
            setRegex((prev) => [
              ...prev,
              { label: tag.name, type: "operator" },
            ]);
          }}
          labelClassName={""}
        />
      </DropdownItem>
    </Dropdown>
  );
}
