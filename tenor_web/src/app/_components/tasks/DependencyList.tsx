"use client";

import { useParams } from "next/navigation";
import React, { useRef, useState } from "react";
import SecondaryButton from "~/app/_components/buttons/SecondaryButton";
import Dropdown, {
  DropdownButton,
  DropdownItem,
} from "~/app/_components/Dropdown";
import TagComponent from "~/app/_components/TagComponent";
import type { TaskPreview } from "~/lib/types/detailSchemas";
import { api } from "~/trpc/react";
import Check from "@mui/icons-material/Check";
import { cn } from "~/lib/utils";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import type { StatusTag, Task, WithId } from "~/lib/types/firebaseSchemas";

interface Props {
  tasks: TaskPreview[];
  onChange: (tasks: TaskPreview[]) => void;
  taskId?: string;
  label: string;
  onClick?: (taskId: string) => void;
  disabled?: boolean;
}

export default function DependencyList({
  tasks,
  onChange,
  label,
  taskId,
  onClick,
  disabled = false,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { projectId } = useParams();

  const { data: todoStatusTag } = api.settings.getTodoTag.useQuery({
    projectId: projectId as string,
  });

  const { data: allTasks } = api.tasks.getTasks.useQuery({
    projectId: projectId as string,
  });
  const allTasksExpectCurrent = allTasks?.filter((task) => task.id !== taskId);

  const formatTaskScrumId = useFormatTaskScrumId();

  const filteredTasks = allTasksExpectCurrent?.filter((task) => {
    const scrumId = formatTaskScrumId(task.scrumId);
    const fullTaskName = `${scrumId}: ${task.name}`;
    if (
      searchValue !== "" &&
      !fullTaskName.toLowerCase().includes(searchValue.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const areEqual = (ts1: WithId<Task>, ts2: TaskPreview) => {
    return ts1.id === ts2.id;
  };

  const areEqual2 = (ts1: TaskPreview, ts2: TaskPreview) => {
    return ts1.id === ts2.id;
  };

  const isSelected = (ts: WithId<Task>) => {
    if (tasks.length === 0) return false;

    for (const selectedTask of tasks) {
      if (areEqual(ts, selectedTask)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div>
      <div className="mt-4 flex items-center justify-between">
        <h3 className="flex items-center gap-1 text-lg font-semibold">
          {label}
          {tasks.length > 0 && (
            <span className="text-sm font-normal">({tasks.length})</span>
          )}
        </h3>
        <Dropdown
          label={!disabled && <span className="text-2xl">+</span>}
          onOpen={() => inputRef.current?.focus()}
        >
          <DropdownItem className="flex w-52 flex-col">
            <span className="mb-2 text-sm text-gray-500">Add a dependency</span>
            <input
              ref={inputRef}
              type="text"
              className="mb-1 w-full rounded-md border border-app-border px-2 py-1 text-sm outline-none"
              placeholder="Search tasks..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </DropdownItem>
          <div className="w-full whitespace-nowrap text-left">
            <div className="flex max-h-40 flex-col overflow-y-auto rounded-b-lg">
              {filteredTasks?.map((task) => (
                <DropdownButton
                  key={task.id}
                  onClick={() => {
                    if (isSelected(task)) {
                      onChange(tasks.filter((ts) => !areEqual(task, ts)));
                    } else {
                      onChange([
                        ...tasks,
                        {
                          ...task,
                          status: todoStatusTag as StatusTag,
                        },
                      ]);
                    }
                  }}
                  className="flex max-w-52 items-center border-b border-app-border px-2 py-2 last:border-none"
                  data-tooltip-id="tooltip"
                  data-tooltip-content={task.name}
                  data-tooltip-delay-show={500}
                >
                  <Check
                    fontSize="inherit"
                    className={cn({
                      "opacity-0": !isSelected(task),
                    })}
                  ></Check>
                  <span className="flex w-full gap-1 px-2">
                    <span className="font-medium">
                      TS{task.scrumId.toString().padStart(2, "0")}:
                    </span>
                    <span className="flex-1 truncate">{task.name}</span>
                  </span>
                </DropdownButton>
              ))}
              {allTasksExpectCurrent?.length === 0 && (
                <span className="w-full p-2 text-center text-sm text-gray-600">
                  No tasks exist
                </span>
              )}
            </div>
          </div>
        </Dropdown>
      </div>
      <div className="grid grid-flow-row grid-cols-4 gap-2">
        {tasks
          ?.slice(
            0,
            showAll ? undefined : (tasks.length ?? 0) === 6 ? 6 : 5, // Only show 6 if there are exactly 6, otherwise show 5 to make room for the show more button
          )
          .map((task) => (
            <TagComponent
              disabled={disabled}
              key={task.id}
              onDelete={() =>
                onChange(tasks.filter((ts) => !areEqual2(task, ts)))
              }
              className="text-left"
              data-tooltip-id="tooltip"
              data-tooltip-content={task.name}
              onClick={() => onClick?.(task.id)}
            >
              {formatTaskScrumId(task.scrumId ?? 0)}
            </TagComponent>
          ))}
        {(tasks.length ?? 0) > 6 && (
          <SecondaryButton
            className="flex h-8 items-center rounded-full text-sm text-app-primary"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show less" : "Show all"}
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
