import React, { useState } from "react";
import { cn } from "~/lib/utils";
import { type ClassNameValue } from "tailwind-merge";
import Table, { type TableColumns } from "../table/Table";
import { FilterSearch } from "../FilterSearch";
import PrimaryButton from "../buttons/PrimaryButton";

interface Props {
  label: string;
  teamMembers: TeamMember[];
  handleMemberAdd: (email: string) => void;
  handleMemberRemove: (id: (string | number)[]) => void;
  className?: ClassNameValue;
}

export interface TeamMember {
  id: number;
  picture_url: string;
  name: string;
  email: string;
  role: string;
}

export default function MemberTable({
  label,
  teamMembers,
  handleMemberAdd,
  handleMemberRemove,
  className,
}: Props) {
  const handleAddLinkClick = () => {
    const memberEmail = prompt("Enter member email:");
    if (memberEmail?.trim()) {
      handleMemberAdd(memberEmail.trim());
    }
  };

  const columns: TableColumns<TeamMember> = {
    id: { visible: false },
    picture_url: {
      label: "Picture",
      width: 50,
      render(row) {
        return (
          <img
            className="h-8 w-8 rounded-full"
            src={row.picture_url}
            alt="User picture"
          />
        );
      },
    },
    name: {
      label: "Name",
      width: 140,
      filterable: "list",
    },
    email: {
      label: "Email",
      width: 180,
      sortable: false,
      filterable: "search-only",
    },
    role: {
      label: "Role",
      width: 120,
      filterable: "list",
      sortable: true,
    },
  };

  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className={cn("w-full", className)}>
      {/* FIMXE: Add seach bar */}
      <div className="flex items-center justify-between py-4">
        <label
          htmlFor="project-description"
          className="justify flex text-sm font-semibold"
        >
          {label}
        </label>
        <PrimaryButton className="text-sm" onClick={handleAddLinkClick}>
          + Add Member
        </PrimaryButton>
      </div>

      <Table
        className="h-[200px] text-sm"
        data={teamMembers}
        columns={columns}
        multiselect
        deletable
        onDelete={(ids) => handleMemberRemove(ids)}
      />
    </div>
  );
}
