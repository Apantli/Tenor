"use client";

import { useDraggable } from "@dnd-kit/react";
import ProfilePicture from "~/app/_components/ProfilePicture";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/helpers/utils";
import { api } from "~/trpc/react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useState } from "react";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import { useParams } from "next/navigation";

interface Props {
  editable: boolean;
  task: WithId<Task>;
  setTask: (task: WithId<Task>) => void;
  setDetailItemId: (id: string) => void;
  selectedTasksId: string[];
  setSelectedTasksId: (ids: string[]) => void;
  dateSelected?: boolean;
}

export const TaskCalendarCard = ({
  editable = false,
  task,
  setTask,
  setDetailItemId,
  selectedTasksId,
  setSelectedTasksId,
  dateSelected = true,
}: Props) => {
  const { projectId } = useParams();
  const { ref, isDragging } = useDraggable({
    id: task.id,
    // disabled: selectedTasksId ? selectedTasksId.length > 0 : false, // Don't allow dragging if selection in progress
    // FIXME: Enable feature
    disabled: true,
  });

  const [hovering, setHovering] = useState(false);

  const handleClick = () => {
    setTask?.(task);
    setDetailItemId?.(task.id);
  };

  const formatTaskScrumId = useFormatTaskScrumId();

  const { data: users } = api.users.getUsers.useQuery({
    projectId: projectId as string,
  });
  const user = users?.find((u) => u.id === task.assigneeId);

  return (
    <div
      className={cn(
        "flex h-6 w-full cursor-pointer items-center rounded-lg border border-gray-300 bg-white p-0.5 text-xs font-semibold",
        isDragging && "bg-gray-100",
        selectedTasksId.includes(task.id)
          ? "bg-app-primary text-white"
          : "hover:bg-gray-100",
      )}
      onClick={handleClick}
      ref={ref}
      // hover vairalbe
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        key="card"
        className="flex w-full grow items-center justify-between pl-1"
      >
        <div className="flex items-center">
          {editable && (
            <div
              className={cn(
                "w-0 shrink-0 grow basis-0 overflow-hidden opacity-0 transition-all group-hover:basis-4 group-hover:opacity-100",
                {
                  "basis-5 opacity-100":
                    dateSelected || selectedTasksId.length > 0 || hovering,
                },
              )}
            >
              <InputCheckbox
                checked={selectedTasksId?.includes(task.id) ?? false}
                onChange={() => {
                  if (selectedTasksId.includes(task.id)) {
                    setSelectedTasksId(
                      selectedTasksId.filter((id) => id !== task.id),
                    );
                  } else {
                    setSelectedTasksId([...selectedTasksId, task.id]);
                  }
                }}
              />
            </div>
          )}
          <p>{formatTaskScrumId(task.scrumId)}</p>
        </div>
        <div className="flex items-center">
          {user && <ProfilePicture user={user} pictureClassName="h-4 w-4" />}
          <ChevronRightIcon />
        </div>
      </div>
    </div>
  );
};
