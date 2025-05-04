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
import { emptyRole } from "~/lib/defaultProjectValues";
import { useAlert } from "~/app/_hooks/useAlert";
import { UserPreview } from "~/lib/types/detailSchemas";
import { UserCol } from "~/lib/types/columnTypes";
import { WithId } from "~/lib/types/firebaseSchemas";

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
  isSearchable = false,
}: Props) {
  const [searchValue, setSearchValue] = useState("");
  const [tableSearchValue, setTableSearchValue] = useState("");
  const { alert } = useAlert();
  const { data: users, isLoading } = api.users.getGlobalUsers.useQuery({
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
                alert("Oops...", "You cannot edit the role of the owner.", {
                  type: "error",
                  duration: 5000,
                });
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
            <PrimaryButton className="flex items-center" asSpan>
              + Add Member
            </PrimaryButton>
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
              {session.user &&
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
                })}
            </div>
          </div>
        </Dropdown>
      </div>

      <Table
        emptyMessage="No members found"
        className="w-full"
        data={filteredTeamMembers} // filter tableSearchValue by name or email
        columns={columns}
        multiselect
        deletable={{
          deleteText: "Remove",
        }}
        onDelete={(ids) => handleMemberRemove(ids)}
        tableKey="team-member-table"
      />
    </div>
  );
}
