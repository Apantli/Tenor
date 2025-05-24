"use client";

import ProfilePicture from "~/app/_components/ProfilePicture";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { api } from "~/trpc/react";

interface Props {
  task: WithId<Task>;
  setTask?: (task: WithId<Task>) => void;
  setDetailItemId?: (id: string) => void;
}

export const TaskCalendarCard = ({ task, setTask, setDetailItemId }: Props) => {
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
      className="flex h-6 w-full cursor-pointer items-center rounded-lg border border-gray-300 p-0.5 text-xs font-semibold hover:bg-gray-100"
      onClick={handleClick}
    >
      <div className="flex w-full items-center justify-between">
        <p>{formatTaskScrumId(task.scrumId)}</p>
        {user && <ProfilePicture user={user} pictureClassName="h-4 w-4" />}
      </div>
    </div>
  );
};
