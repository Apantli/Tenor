"use client";

import Dropdown, { DropdownItem } from "~/app/_components/Dropdown";
import type { Sprint, Tag, WithId } from "~/lib/types/firebaseSchemas";
import TuneIcon from "@mui/icons-material/Tune";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
// import { Checkbox } from "@mui/material";
// import ProfilePicture from "~/app/_components/ProfilePicture";
import { Checkbox } from "@mui/material";
import { type UserPreview } from "~/lib/types/detailSchemas";
import TagComponent from "~/app/_components/TagComponent";
import { sizeTags } from "~/lib/defaultProjectValues";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { UserPicker } from "~/app/_components/specific-pickers/UserPicker";
import { SprintPicker } from "~/app/_components/specific-pickers/SprintPicker";
// import { UserPreview } from "~/lib/types/detailSchemas";

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
      label: "Priorities",
      options: prioritiesData ?? [],
      value: priorities,
      setValue: setPriorities,
    },
    {
      field: "size",
      label: "Sizes",
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
      label: "Backlog Tags",
      options: backlogTags ?? [],
      value: tags,
      setValue: setTags,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        label={<LocalOfferIcon />}
        menuClassName="max-h-80
        overflow-y-auto"
        close={false}
      >
        {filters.map((filter) => (
          <DropdownItem key={filter.label}>
            <h1 className="text-lg font-semibold">{filter.label}</h1>
            {filter.options?.map((option) => (
              <DropdownItem key={option.id}>
                <div className="flex">
                  <Checkbox
                    checked={filter.value.some((i) => i.id === option.id)}
                    onClick={() => {
                      const exists = filter.value.some(
                        (i) => i.id === option.id,
                      );
                      if (exists) {
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
                    className="max-w-20 truncate"
                  >
                    {option.name}
                  </TagComponent>
                </div>
              </DropdownItem>
            ))}
          </DropdownItem>
        ))}
      </Dropdown>
      <Dropdown label={<TuneIcon />} close={false}>
        <DropdownItem>
          <h1 className="text-lg font-semibold">Assignee</h1>
          <UserPicker
            close={false}
            selectedOption={assignee}
            options={users ?? []}
            onChange={setAssignee}
          />
        </DropdownItem>
        <DropdownItem>
          <h1 className="text-lg font-semibold">Sprint</h1>
          <SprintPicker
            close={false}
            selectedOption={sprint}
            options={sprintsData ?? []}
            onChange={setSprint}
          />
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
