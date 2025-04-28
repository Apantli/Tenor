"use client";

import { ClassNameValue } from "tailwind-merge";
import { useState } from "react";
import { cn } from "~/lib/utils";
import SearchBar from "../SearchBar";
import Dropdown, { DropdownButton, DropdownItem } from "../Dropdown";
import PrimaryButton from "../buttons/PrimaryButton";
import InputTextField from "../inputs/InputTextField";
import Table, { type TableColumns } from "../table/Table";
import PillPickerComponent from "../PillPickerComponent";
import { Checkbox } from "@mui/material";
import {
  permissionItems,
  permissionLabels,
  Role,
} from "~/lib/types/firebaseSchemas";
import { RoleDetail } from "~/lib/types/detailSchemas";

interface Props {
  label?: string;
  roles: RoleDetail[];
  handleRoleAdd: (label: string) => void;
  handleRoleRemove: (id: (string | number)[]) => void;
  // handleEditMemberRole: (id: string, role: string) => void;
  className?: ClassNameValue;
  isSearchable?: boolean;
}

export default function RoleList({
  label,
  roles,
  className,
  handleRoleAdd,
  handleRoleRemove,
  isSearchable = false,
}: Props) {
  const [tableSearchValue, setTableSearchValue] = useState("");
  const [role, setRole] = useState("");

  const defaultWidth = 100;
  const columns: TableColumns<RoleDetail> = {
    id: { visible: false },
    label: {
      label: "Name",
      width: 140,
    },
    canViewPerformance: {
      label: "Can View Performance",
      width: defaultWidth,
      render: (row) => {
        return <Checkbox checked={row.canViewPerformance} />;
      },
    },
    canControlSprints: {
      label: "Can Control Sprints",
      width: defaultWidth,
      render: (row) => {
        return <Checkbox checked={row.canControlSprints} />;
      },
    },
    requirements: {
      label: "Requirements",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            label={permissionLabels[row.requirements]}
            selectedItem={{
              id: row.requirements.toString(),
              label: permissionLabels[row.requirements],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              console.log("Selected item:", item);
            }}
          />
        );
      },
    },
    userStories: {
      label: "User Stories",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            label={permissionLabels[row.userStories]}
            selectedItem={{
              id: row.userStories.toString(),
              label: permissionLabels[row.userStories],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              console.log("Selected item:", item);
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
            label={permissionLabels[row.issues]}
            selectedItem={{
              id: row.issues.toString(),
              label: permissionLabels[row.issues],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              console.log("Selected item:", item);
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
            label={permissionLabels[row.sprints]}
            selectedItem={{
              id: row.sprints.toString(),
              label: permissionLabels[row.sprints],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              console.log("Selected item:", item);
            }}
          />
        );
      },
    },
    kanban: {
      label: "Kanban",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            label={permissionLabels[row.kanban]}
            selectedItem={{
              id: row.kanban.toString(),
              label: permissionLabels[row.kanban],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              console.log("Selected item:", item);
            }}
          />
        );
      },
    },
    calendar: {
      label: "Calendar",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            label={permissionLabels[row.calendar]}
            selectedItem={{
              id: row.calendar.toString(),
              label: permissionLabels[row.calendar],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              console.log("Selected item:", item);
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
            label={permissionLabels[row.performance]}
            selectedItem={{
              id: row.performance.toString(),
              label: permissionLabels[row.performance],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              console.log("Selected item:", item);
            }}
          />
        );
      },
    },
    projectSettings: {
      label: "Project Settings",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            label={permissionLabels[row.projectSettings]}
            selectedItem={{
              id: row.projectSettings.toString(),
              label: permissionLabels[row.projectSettings],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              console.log("Selected item:", item);
            }}
          />
        );
      },
    },
    sprintReview: {
      label: "Sprint Review",
      width: defaultWidth,
      render: (row) => {
        return (
          <PillPickerComponent
            label={permissionLabels[row.sprintReview]}
            selectedItem={{
              id: row.sprintReview.toString(),
              label: permissionLabels[row.sprintReview],
            }}
            hideSearch={true}
            allItems={permissionItems}
            onChange={(item: { id: string; label: string }): void => {
              console.log("Selected item:", item);
            }}
          />
        );
      },
    },
  };

  return (
    <div className={cn("w-full text-sm", className)}>
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
            <PrimaryButton
              asSpan // Needed because the dropdown label is automatically a button and we can't nest buttons
              className="flex max-h-[40px] items-center text-sm font-semibold"
            >
              Add Role +
            </PrimaryButton>
          }
        >
          <DropdownItem>
            <InputTextField
              placeholder="New Role Name"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
              }}
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
        className="w-full"
        data={roles} // filter tableSearchValue by name or email
        columns={columns}
        multiselect
        deletable={{
          deleteText: "Remove",
        }}
        onDelete={(ids) => handleRoleRemove(ids)}
        tableKey="team-member-table"
      />
    </div>
  );
}
