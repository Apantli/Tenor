"user client";
import React, { useMemo, useState } from "react";
import { cn } from "~/lib/utils";
import { type ClassNameValue } from "tailwind-merge";
import Table, { type TableColumns } from "../table/Table";
import PrimaryButton from "../buttons/PrimaryButton";
import { api } from "~/trpc/react";
import Dropdown, { DropdownButton, DropdownItem } from "../Dropdown";
import ProfilePicture from "../ProfilePicture";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import PillPickerComponent from "../PillPickerComponent";
import SearchBar from "../SearchBar";

interface Props {
  label?: string;
  teamMembers: TeamMember[];
  handleMemberAdd: (user: TeamMember) => void;
  handleMemberRemove: (id: (string | number)[]) => void;
  handleEditMemberRole: (id: string, role: string) => void;
  className?: ClassNameValue;
  roleList: { id: string; label: string }[];
  isSearchable?: boolean;
}

export interface TeamMember {
  id: string;
  photoURL?: string;
  displayName: string;
  email: string;
  role: string;
}

export default function MemberTable({
  label,
  teamMembers,
  handleMemberAdd,
  handleMemberRemove,
  handleEditMemberRole,
  className,
  roleList,
  isSearchable = false,
}: Props) {
  const { data: users, isLoading } = api.users.getUserList.useQuery();
  const [searchValue, setSearchValue] = useState("");
  const [tableSearchValue, setTableSearchValue] = useState("");

  const filteredTeamMembers = useMemo(() => {
    const search = tableSearchValue.toLowerCase();
    return teamMembers.filter((member) => {
      return (
        member.displayName?.toLowerCase().includes(search) ||
        member.email?.toLowerCase().includes(search)
      );
    });
  }, [teamMembers, tableSearchValue]);

  const columns: TableColumns<TeamMember> = {
    id: { visible: false },
    photoURL: {
      label: "",
      width: 50,
      render(row) {
        return <ProfilePicture user={{ ...row, uid: row.id }} hideTooltip />;
      },
    },
    displayName: {
      label: "Name",
      width: 140,
    },
    email: {
      label: "Email",
      width: 180,
    },
    role: {
      label: "Role",
      width: 120,
      render(row) {
        return (
          <PillPickerComponent
            className="w-full text-sm"
            hideSearch
            selectedItem={
              roleList.find((role) => role.id === row.role) ?? {
                id: "viewer_role_id",
                label: "Viewer",
              }
            }
            allItems={roleList}
            onChange={(item) => {
              handleEditMemberRole(row.id, item.id);
            }}
          />
        );
      },
    },
  };

  const session = useFirebaseAuth();

  return (
    <div className={cn("w-full text-sm", className)}>
      {/* FIMXE: Add seach bar */}
      <div className="flex items-center justify-between gap-x-4 py-4">
        {label && (
          <label
            htmlFor="project-description"
            className="justify flex text-sm font-semibold"
          >
            {label}
          </label>
        )}
        {isSearchable && (
          <SearchBar
            searchValue={tableSearchValue}
            placeholder="Find a member..."
            handleUpdateSearch={(e) => {
              setTableSearchValue(e.target.value);
            }}
          />
        )}
        <Dropdown
          label={
            <PrimaryButton className="flex items-center text-sm" asSpan>
              + Add Member
            </PrimaryButton>
          }
        >
          <DropdownItem>
            <SearchBar
              searchValue={searchValue}
              placeholder={"Member's name"}
              handleUpdateSearch={(e) => {
                setSearchValue(e.target.value);
              }}
            ></SearchBar>
          </DropdownItem>

          <div className="whitespace-nowraptext-left w-full text-sm">
            <div className="flex max-h-40 flex-col overflow-y-scroll rounded-b-lg text-sm">
              {session.user &&
                users?.map((user) => {
                  if (user.id === session.user?.uid) return null;
                  if (teamMembers.find((member) => member.id === user.id))
                    return null;

                  if (!(user.email + user.displayName).includes(searchValue))
                    return null;

                  return (
                    <DropdownButton
                      key={user.id}
                      onClick={() => {
                        handleMemberAdd(user);
                        setSearchValue("");
                      }}
                      className="cursor-pointer border-b border-app-border last:border-none"
                    >
                      <div className="flex items-center">
                        <ProfilePicture user={user ?? null} hideTooltip />
                        <span className="ml-2 text-sm">
                          {user.displayName ?? user.email}
                        </span>
                      </div>
                    </DropdownButton>
                  );
                })}
            </div>
          </div>
        </Dropdown>
      </div>

      <Table
        className="h-[200px] text-sm"
        data={filteredTeamMembers} // filter tableSearchValue by name or email
        columns={columns}
        multiselect
        deletable={{
          deleteText: "Remove",
        }}
        onDelete={(ids) => handleMemberRemove(ids)}
      />
    </div>
  );
}
