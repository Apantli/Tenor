"use client";

import Dropdown, { DropdownItem } from "~/app/_components/Dropdown";
import type { Sprint, Tag, WithId } from "~/lib/types/firebaseSchemas";
import TuneIcon from "@mui/icons-material/Tune";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import { type UserPreview } from "~/lib/types/detailSchemas";
import TagComponent from "~/app/_components/TagComponent";
import { sizeTags } from "~/lib/defaultProjectValues";
import { UserPicker } from "~/app/_components/specific-pickers/UserPicker";
import { SprintPicker } from "~/app/_components/specific-pickers/SprintPicker";
import SecondaryButton from "~/app/_components/buttons/SecondaryButton";
import { cn } from "~/lib/utils";

interface Props {
  tags: WithId<Tag>[];
  setTags: (tags: WithId<Tag>[]) => void;

  priorities: WithId<Tag>[];
  setPriorities: (priorities: WithId<Tag>[]) => void;

  size: WithId<Tag>[];
  setSizes: (size: WithId<Tag>[]) => void;

  assignee: WithId<UserPreview> | undefined;
  setAssignee: (assignee: WithId<UserPreview> | undefined) => void;

  sprint: WithId<Sprint> | undefined;
  setSprint: (sprints: WithId<Sprint> | undefined) => void;
}

export default function AdvancedSearch({
  tags,
  setTags,
  priorities,
  setPriorities,
  size,
  setSizes,
  assignee,
  setAssignee,
  sprint,
  setSprint,
}: Props) {
  // GENERAL
  const { projectId } = useParams();

  const { data: users } = api.users.getUsers.useQuery({
    projectId: projectId as string,
  });

  const { data: sprintsData } = api.sprints.getProjectSprintsOverview.useQuery({
    projectId: projectId as string,
  });

  const { data: prioritiesData } = api.settings.getPriorityTypes.useQuery({
    projectId: projectId as string,
  });

  const { data: backlogTags } = api.settings.getBacklogTags.useQuery({
    projectId: projectId as string,
  });

  const filters = [
    {
      field: "priority",
      label: "Priority",
      options: prioritiesData ?? [],
      value: priorities,
      setValue: setPriorities,
    },
    {
      field: "size",
      label: "Size",
      options: sizeTags.map(
        (tag) =>
          ({
            ...tag,
            id: tag.id ?? tag.name,
          }) as WithId<Tag>,
      ),
      value: size,
      setValue: setSizes,
    },
    {
      field: "backlog",
      label: "Tags",
      options: backlogTags ?? [],
      value: tags,
      setValue: setTags,
    },
  ];

  const clearFilters = () => {
    setAssignee(undefined);
    setSprint(undefined);
    setPriorities([]);
    setSizes([]);
    setTags([]);
  };

  const showClear =
    assignee !== undefined ||
    sprint !== undefined ||
    tags.length > 0 ||
    priorities.length > 0 ||
    size.length > 0;

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        label={
          <span
            className={cn("rounded text-app-text", {
              "text-app-secondary": showClear,
            })}
          >
            <TuneIcon />
          </span>
        }
        menuClassName="w-[500px]"
        data-tooltip-id="tooltip"
        data-tooltip-content={showClear ? "Filters applied" : "Filters"}
      >
        <DropdownItem>
          <h1 className="relative w-full text-center font-medium">
            <SecondaryButton
              className={cn(
                "pointer-events-none absolute left-0 flex h-6 items-center text-sm opacity-0 transition",
                {
                  "pointer-events-auto opacity-100": showClear,
                },
              )}
              onClick={clearFilters}
            >
              Clear
            </SecondaryButton>
            <span>Filters</span>
          </h1>
        </DropdownItem>
        <DropdownItem className="flex w-full p-0">
          {filters.map((filter) => (
            <div
              key={filter.field}
              className="relative max-h-[160px] flex-1 overflow-y-auto border-r border-app-border px-2 pb-2"
            >
              <h1 className="text- sticky top-0 bg-white pt-2 font-semibold">
                {filter.label}
              </h1>
              {filter.options?.map((option) => (
                <div key={option.id} className="my-1 flex items-center gap-2">
                  <InputCheckbox
                    checked={filter.value.some((i) => i.id === option.id)}
                    onChange={(newValue) => {
                      if (!newValue) {
                        filter.setValue(
                          filter.value.filter((i) => i.id !== option.id),
                        );
                      } else {
                        filter.setValue([...filter.value, option]);
                      }
                    }}
                  />
                  <TagComponent
                    color={option.color}
                    reducedPadding
                    className="w-16 truncate"
                  >
                    {option.name}
                  </TagComponent>
                </div>
              ))}
            </div>
          ))}
          <div className="flex-[2] p-2">
            <h1 className="font-semibold">Assignee</h1>
            <UserPicker
              className="h-10 max-w-[170px]"
              selectedOption={assignee}
              options={users ?? []}
              onChange={setAssignee}
              allowSetSelf
            />
            <h1 className="mt-2 font-semibold">Sprint</h1>
            <SprintPicker
              className="h-10 max-w-[170px]"
              selectedOption={sprint}
              options={sprintsData ?? []}
              onChange={setSprint}
            />
          </div>
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
