import React from "react";
import { cn } from "~/lib/utils";
import { type ClassNameValue } from "tailwind-merge";
import Table, { type TableColumns } from "../table/Table";
import { FilterSearch } from "../FilterSearch";
import PrimaryButton from "../PrimaryButton";

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

export default function MemberTable({ label, teamMembers, handleMemberAdd, handleMemberRemove, className }: Props) {
    const handleAddLinkClick = () => {
        const memberName = prompt("Enter member email:");
        if (memberName?.trim()) {
            handleMemberAdd(memberName.trim());
        }
    };

    const columns: TableColumns<TeamMember> = {
        id: { visible: false },
        picture_url : {
            label: "Picture",
            width: 50,
            render(row) {
            return (
                <img
                className="rounded-full w-8 h-8"
                src={row.picture_url}
                alt="User picture"
                />
            );
            },
        },
        name: {
            label: "Name",
            width: 140,
            filterable: "list", // list: shows the user a list of row values to filter by
            // // Optionally: You may provide a render function to present the information in any way you like
            // // This is to be used when displaying a pill in the table, but can be used to add any component you like
            // render(row) {
            //   return <span className="font-bold">{row.degree}</span>;
            // },
        },
        email: {
            label: "Email",
            width: 180,
            sortable: false,
            filterable: "search-only", // search-only: The user must type their query
        },
        role: {
            label: "Role",
            width: 120,
            filterable: "list",
            sortable: true,
        },
        };

  return (
    <div className={cn("w-full", className)}>
    <label htmlFor="project-description" className="text-sm font-semibold" >
        {label}
    </label>
    
    <div className="flex justify-between items-center mb-4 py-4">
        <FilterSearch list={[]} onSearch={(searchTerm) => console.log(searchTerm)} placeholder="Search member..."></FilterSearch>
        <PrimaryButton className="text-sm" onClick={handleAddLinkClick}>+ Add Member</PrimaryButton>
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
