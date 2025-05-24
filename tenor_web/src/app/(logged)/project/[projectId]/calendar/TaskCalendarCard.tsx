"use client";

import { useDraggable } from "@dnd-kit/react";
import ProfilePicture from "~/app/_components/ProfilePicture";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface Props {
  task: WithId<Task>;
  setTask?: (task: WithId<Task>) => void;
  setDetailItemId?: (id: string) => void;
}

export const TaskCalendarCard = ({ task, setTask, setDetailItemId }: Props) => {
  const { ref, isDragging } = useDraggable({
    id: task.id,
    disabled: false, // Don't allow dragging if selection in progress
  });

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
        "flex h-6 w-full cursor-pointer items-center rounded-lg border border-gray-300 bg-white p-0.5 text-xs font-semibold hover:bg-gray-100",
        isDragging && "bg-gray-100",
      )}
      onClick={handleClick}
      ref={ref}
    >
      <div className="flex w-full items-center justify-between pl-1">
        <p>{formatTaskScrumId(task.scrumId)}</p>
        {user && <ProfilePicture user={user} pictureClassName="h-4 w-4" />}
      </div>
    </div>
  );
};
