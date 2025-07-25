"use client";

import type { ClassNameValue } from "tailwind-merge";
import { useState } from "react";
import { cn } from "~/lib/helpers/utils";
import {
  permissionItems,
  permissionLabels,
  type WithId,
} from "~/lib/types/firebaseSchemas";
import type { RoleDetail } from "~/lib/types/detailSchemas";
import type { Permission } from "~/lib/types/zodFirebaseSchema";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import PillPickerComponent from "~/app/_components/inputs/pickers/PillPickerComponent";
import SearchBar from "~/app/_components/inputs/search/SearchBar";
import Dropdown, {
  DropdownButton,
  DropdownItem,
} from "~/app/_components/Dropdown";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import InputTextField from "~/app/_components/inputs/text/InputTextField";

interface Props {
  label?: string;
  roles: WithId<RoleDetail>[];
  handleRoleAdd: (label: string) => void;
  handleRoleRemove: (id: (string | number)[]) => void;
  handleEditTabPermission: (
    roleId: string,
    tabId: string,
    permission: Permission,
  ) => void;
  className?: ClassNameValue;
  isSearchable?: boolean;
  disabled?: boolean;
}

// FIXME: This whole section is very laggy and needs to be optimized. Removing the pickers from the table kinda fixes the issue
export default function RoleTable({
  label,
  roles,
  className,
  handleRoleAdd,
  handleRoleRemove,
  handleEditTabPermission,
  isSearchable = false,
  disabled = false,
}: Props) {
  const [tableSearchValue, setTableSearchValue] = useState("");
  const [role, setRole] = useState("");

  const defaultWidth = 100;
  const columns: TableColumns<WithId<RoleDetail>> = {
    id: { visible: false },
    reviews: { visible: false },
    label: {
      label: "Name",
      width: 120,
    },
    overview: { visible: false },
    backlog: {
      label: "Backlog",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            disabled={disabled}
            label={permissionLabels[row.backlog]}
            selectedItem={{
              id: row.backlog.toString(),
              label: permissionLabels[row.backlog],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              handleEditTabPermission(
                row.id,
                "backlog",
                parseInt(item.id) as Permission,
              );
            }}
          />
        );
      },
    },
    issues: {
      label: "Issues",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            disabled={disabled}
            label={permissionLabels[row.issues]}
            selectedItem={{
              id: row.issues.toString(),
              label: permissionLabels[row.issues],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              handleEditTabPermission(
                row.id,
                "issues",
                parseInt(item.id) as Permission,
              );
            }}
          />
        );
      },
    },
    scrumboard: {
      label: "Scrum Board",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            disabled={disabled}
            label={permissionLabels[row.scrumboard]}
            selectedItem={{
              id: row.scrumboard.toString(),
              label: permissionLabels[row.scrumboard],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              handleEditTabPermission(
                row.id,
                "scrumboard",
                parseInt(item.id) as Permission,
              );
            }}
          />
        );
      },
    },
    sprints: {
      label: "Sprints",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            disabled={disabled}
            label={permissionLabels[row.sprints]}
            selectedItem={{
              id: row.sprints.toString(),
              label: permissionLabels[row.sprints],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              handleEditTabPermission(
                row.id,
                "sprints",
                parseInt(item.id) as Permission,
              );
            }}
          />
        );
      },
    },
    performance: {
      label: "Performance",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            disabled={disabled}
            label={permissionLabels[row.performance]}
            selectedItem={{
              id: row.performance.toString(),
              label: permissionLabels[row.performance],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              handleEditTabPermission(
                row.id,
                "performance",
                parseInt(item.id) as Permission,
              );
            }}
          />
        );
      },
    },
    retrospective: {
      label: "Retrospectives",
      width: defaultWidth + 40,
      render: (row) => {
        return (
          <PillPickerComponent
            disabled={disabled}
            label={permissionLabels[row.retrospective]}
            selectedItem={{
              id: row.retrospective.toString(),
              label: permissionLabels[row.retrospective],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              handleEditTabPermission(
                row.id,
                "retrospective",
                parseInt(item.id) as Permission,
              );
            }}
          />
        );
      },
    },
    settings: {
      label: "Settings",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            disabled={disabled}
            label={permissionLabels[row.settings]}
            selectedItem={{
              id: row.settings.toString(),
              label: permissionLabels[row.settings],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              handleEditTabPermission(
                row.id,
                "settings",
                parseInt(item.id) as Permission,
              );
            }}
          />
        );
      },
    },
  };

  const filteredRoles = roles.filter((role) => {
    const search = tableSearchValue.toLowerCase();
    return role.label.toLowerCase().includes(search);
  });

  return (
    <div className={cn("w-full", className)}>
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
            placeholder="Find a role..."
            handleUpdateSearch={(e) => {
              setTableSearchValue(e.target.value);
            }}
          />
        )}

        <Dropdown
          label={
            !disabled && (
              <PrimaryButton
                asSpan // Needed because the dropdown label is automatically a button and we can't nest buttons
              >
                + Add Role
              </PrimaryButton>
            )
          }
        >
          <DropdownItem>
            <InputTextField
              placeholder="New Role Name"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
              }}
              disableAI
            />
          </DropdownItem>

          <DropdownButton
            className="flex items-center justify-between"
            onClick={() => {
              handleRoleAdd(role);
              setRole("");
            }}
          >
            <span>Add Role</span>
          </DropdownButton>
        </Dropdown>
      </div>

      <Table
        emptyMessage="No roles found"
        className="w-full"
        data={filteredRoles}
        columns={columns}
        multiselect={!disabled}
        deletable={!disabled}
        onDelete={(ids) => handleRoleRemove(ids)}
        tableKey="team-member-table"
      />
    </div>
  );
}
