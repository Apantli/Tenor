"user client";
import React, { useState } from "react";
import { cn } from "~/lib/helpers/utils";
import { type ClassNameValue } from "tailwind-merge";
import Table, { type TableColumns } from "../table/Table";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import { api } from "~/trpc/react";
import Dropdown, { DropdownButton, DropdownItem } from "../Dropdown";
import ProfilePicture from "../ProfilePicture";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import PillPickerComponent from "./pickers/PillPickerComponent";
import SearchBar from "./search/SearchBar";
import { useAlert } from "~/app/_hooks/useAlert";
import type { UserPreview } from "~/lib/types/detailSchemas";
import type { UserCol } from "~/lib/types/columnTypes";
import type { WithId } from "~/lib/types/firebaseSchemas";
import { emptyRole } from "~/lib/defaultValues/roles";

interface Props {
  label?: string;
  teamMembers: UserCol[];
  handleMemberAdd: (user: WithId<UserPreview>) => void;
  handleMemberRemove: (id: (string | number)[]) => void;
  handleEditMemberRole: (id: string, role: string) => void;
  className?: ClassNameValue;
  roleList: { id: string; label: string }[];
  isSearchable?: boolean;
  labelClassName?: string;
  tableClassName?: string;
  disabled?: boolean;
}

export default function MemberTable({
  label,
  teamMembers,
  handleMemberAdd,
  handleMemberRemove,
  handleEditMemberRole,
  className,
  roleList,
  labelClassName,
  tableClassName,
  isSearchable = false,
  disabled = false,
}: Props) {
  const [searchValue, setSearchValue] = useState("");
  const [tableSearchValue, setTableSearchValue] = useState("");
  const { predefinedAlerts } = useAlert();
  const { data: users } = api.users.getGlobalUsers.useQuery({
    filter: searchValue,
  });

  const search = tableSearchValue.toLowerCase();
  const filteredTeamMembers = teamMembers.filter((member) => {
    return (
      member.displayName?.toLowerCase().includes(search) ||
      member.email?.toLowerCase().includes(search)
    );
  });

  const columns: TableColumns<UserCol> = {
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
      width: 240,
    },
    roleId: {
      label: "Role",
      width: 120,
      render(row) {
        return (
          <PillPickerComponent
            disabled={disabled}
            className="w-full text-sm"
            hideSearch
            selectedItem={
              row.roleId === "owner"
                ? {
                    id: "owner",
                    label: "Owner",
                  }
                : {
                    id: row.roleId,
                    label:
                      roleList.find((role) => role.id === row.roleId)?.label ??
                      emptyRole.label,
                  }
            }
            allItems={roleList}
            onChange={(item) => {
              if (row.roleId !== "owner") {
                handleEditMemberRole(row.id, item.id);
              } else {
                predefinedAlerts.ownerRoleError();
              }
            }}
          />
        );
      },
    },
  };

  const session = useFirebaseAuth();

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-x-4 py-4">
        {label && (
          <label
            htmlFor="project-description"
            className={cn("justify flex font-semibold", labelClassName)}
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
            !disabled && (
              <PrimaryButton className="flex items-center" asSpan>
                + Add Member
              </PrimaryButton>
            )
          }
        >
          <DropdownItem>
            <SearchBar
              searchValue={searchValue}
              placeholder={"Member's name..."}
              handleUpdateSearch={(e) => {
                setSearchValue(e.target.value);
              }}
            ></SearchBar>
          </DropdownItem>

          <div className="whitespace-nowraptext-left w-full text-sm">
            <div className="flex max-h-40 flex-col overflow-y-auto rounded-b-lg text-sm">
              {session.user && users && users.length > 0 ? (
                users?.map((user) => {
                  if (user.id === session.user?.uid) return null;
                  if (teamMembers.find((member) => member.id === user.id))
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
                        <span className="ml-2 text-sm">{user.displayName}</span>
                      </div>
                    </DropdownButton>
                  );
                })
              ) : (
                <span className="w-full px-2 py-1 text-sm text-gray-500">
                  No users found
                </span>
              )}
            </div>
          </div>
        </Dropdown>
      </div>

      <Table
        emptyMessage="No members found"
        className={cn("w-full", tableClassName)}
        data={filteredTeamMembers} // filter tableSearchValue by name or email
        columns={columns}
        multiselect={!disabled}
        deletable={!disabled}
        onDelete={(ids) => handleMemberRemove(ids)}
        tableKey="team-member-table"
      />
    </div>
  );
}
