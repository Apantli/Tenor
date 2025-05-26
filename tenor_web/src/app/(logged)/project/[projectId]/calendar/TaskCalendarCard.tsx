"use client";

import { useDraggable } from "@dnd-kit/react";
import ProfilePicture from "~/app/_components/ProfilePicture";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useState } from "react";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";

interface Props {
  task: WithId<Task>;
  setTask?: (task: WithId<Task>) => void;
  setDetailItemId?: (id: string) => void;
  selectedTasksId?: string[];
  setSelectedTasksId?: (ids: string[]) => void;
}

export const TaskCalendarCard = ({
  task,
  setTask,
  setDetailItemId,
  selectedTasksId,
  setSelectedTasksId,
}: Props) => {
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

  const { data: user } = task.assigneeId
    ? api.users.getGlobalUser.useQuery({
        userId: task.assigneeId,
      })
    : { data: null };
  return (
    <div
      className={cn(
        "flex h-6 w-full cursor-pointer items-center rounded-lg border border-gray-300 bg-white p-0.5 text-xs font-semibold",
        isDragging && "bg-gray-100",
        selectedTasksId?.includes(task.id)
          ? "bg-app-secondary text-white"
          : "hover:bg-gray-100",
      )}
      onClick={handleClick}
      ref={ref}
      // hover vairalbe
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div key="card" className="flex w-full items-center justify-between pl-1">
        <div className="flex items-center">
          {hovering && selectedTasksId && (
            <InputCheckbox
              checked={selectedTasksId.includes(task.id)}
              onChange={() => {
                if (selectedTasksId?.includes(task.id)) {
                  setSelectedTasksId?.(
                    selectedTasksId.filter((id) => id !== task.id),
                  );
                } else {
                  setSelectedTasksId?.([...selectedTasksId, task.id]);
                }
              }}
              className="mr-1"
            />
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
