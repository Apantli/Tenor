"use client";

import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import type { Task, WithId } from "~/lib/types/firebaseSchemas";

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

  return (
    <div
      className="w-full cursor-pointer rounded-lg border border-gray-300 p-1 text-sm text-xs hover:bg-gray-100"
      onClick={handleClick}
    >
      <div>{formatTaskScrumId(task.scrumId)}</div>
    </div>
  );
};
