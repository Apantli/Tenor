import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { TaskCalendarCard } from "./TaskCalendarCard";
import { useDroppable } from "@dnd-kit/react";
import { cn } from "~/lib/utils";

interface Props {
  day: number;
  tasks: WithId<Task>[];

  setTask?: (task: WithId<Task>) => void;
  setDetailItemId?: (id: string) => void;

  selectedTasksId?: string[];
  setSelectedTasksId?: (ids: string[]) => void;
}

export default function CalendarCell({
  day,
  tasks,
  setTask,
  setDetailItemId,
  selectedTasksId,
  setSelectedTasksId,
}: Props) {
  const { ref, isDropTarget } = useDroppable({ id: day });
  return (
    <div
      className={cn("flex h-full w-full", isDropTarget && "bg-gray-100")}
      ref={ref}
    >
      <div className="flex h-full w-full p-0.5">
        <span className="p-1 text-xs">{day}</span>
        <div className="flex h-full w-full flex-col overflow-y-auto">
          {tasks.length > 0
            ? tasks.map((task) => (
                <div className="p-0.5" key={task.id}>
                  <TaskCalendarCard
                    selectedTasksId={selectedTasksId}
                    setSelectedTasksId={setSelectedTasksId}
                    task={task}
                    setTask={setTask}
                    setDetailItemId={setDetailItemId}
                  />
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}
