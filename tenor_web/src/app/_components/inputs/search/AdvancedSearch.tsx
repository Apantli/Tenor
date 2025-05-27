"use client";

import Dropdown, { DropdownItem } from "~/app/_components/Dropdown";
import type { Tag, WithId } from "~/lib/types/firebaseSchemas";
import TuneIcon from "@mui/icons-material/Tune";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import TagComponent from "~/app/_components/TagComponent";
import { sizeTags } from "~/lib/defaultProjectValues";
import { UserPicker } from "~/app/_components/inputs/pickers/UserPicker";
import { SprintPicker } from "~/app/_components/inputs/pickers/SprintPicker";
import SecondaryButton from "~/app/_components/inputs/buttons/SecondaryButton";
import { cn } from "~/lib/utils";
import type { AdvancedSearchFilters } from "../../../_hooks/useAdvancedSearchFilters";
import type { SetStateAction } from "react";

interface Props {
  advancedFilters: AdvancedSearchFilters;
  setAdvancedFilters: React.Dispatch<SetStateAction<AdvancedSearchFilters>>;
  hideSprint?: boolean;
}

export default function AdvancedSearch({
  advancedFilters,
  setAdvancedFilters,
  hideSprint,
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
      field: "priorities" as keyof AdvancedSearchFilters,
      label: "Priority",
      options: prioritiesData ?? [],
    },
    {
      field: "sizes" as keyof AdvancedSearchFilters,
      label: "Size",
      options: sizeTags.map(
        (tag) =>
          ({
            ...tag,
            id: tag.id ?? tag.name,
          }) as WithId<Tag>,
      ),
    },
    {
      field: "tags" as keyof AdvancedSearchFilters,
      label: "Tags",
      options: backlogTags ?? [],
    },
  ];

  const clearFilters = () => {
    setAdvancedFilters({
      tags: [],
      sizes: [],
      priorities: [],
      assignee: undefined,
      sprint: undefined,
    });
  };

  const showClear =
    advancedFilters.assignee !== undefined ||
    advancedFilters.sprint !== undefined ||
    advancedFilters.tags.length > 0 ||
    advancedFilters.priorities.length > 0 ||
    advancedFilters.sizes.length > 0;

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
              {filter.options?.map((option) => {
                const value = advancedFilters[filter.field] as WithId<Tag>[];
                const setValue = (newValue: WithId<Tag>[]) => {
                  setAdvancedFilters({
                    ...advancedFilters,
                    [filter.field]: newValue,
                  });
                };
                return (
                  <div key={option.id} className="my-1 flex items-center gap-2">
                    <InputCheckbox
                      checked={value.some((i) => i.id === option.id)}
                      onChange={(newValue) => {
                        if (!newValue) {
                          setValue(value.filter((i) => i.id !== option.id));
                        } else {
                          setValue([...value, option]);
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
                );
              })}
            </div>
          ))}
          <div className="flex-[2] p-2">
            <h1 className="font-semibold">Assignee</h1>
            <UserPicker
              className="h-10 max-w-[170px]"
              selectedOption={advancedFilters.assignee}
              options={users ?? []}
              onChange={(assignee) => {
                setAdvancedFilters({
                  ...advancedFilters,
                  assignee,
                });
              }}
              allowSetSelf
            />
            {!hideSprint && (
              <>
                <h1 className="mt-2 font-semibold">Sprint</h1>
                <SprintPicker
                  className="h-10 max-w-[170px]"
                  selectedOption={advancedFilters.sprint}
                  options={sprintsData ?? []}
                  onChange={(sprint) => {
                    setAdvancedFilters({
                      ...advancedFilters,
                      sprint,
                    });
                  }}
                />
              </>
            )}
          </div>
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
