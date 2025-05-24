import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { TaskCalendarCard } from "./TaskCalendarCard";
import { useDroppable } from "@dnd-kit/react";
import { cn } from "~/lib/utils";

interface Props {
  day: number;
  tasksByDate: Record<string, WithId<Task>[]> | undefined;

  setTask?: (task: WithId<Task>) => void;
  setDetailItemId?: (id: string) => void;
}

export default function CalendarCell({
  day,
  tasksByDate,
  setTask,
  setDetailItemId,
}: Props) {
  const { ref, isDropTarget } = useDroppable({ id: day });
  return (
    <div
      className={cn("flex h-full w-full", isDropTarget && "bg-gray-100")}
      ref={ref}
    >
      <div className="flex h-full w-full p-0.5">
        <span className="p-1 text-xs">{day}</span>
        <div className="flex max-h-20 w-full flex-col overflow-y-auto">
          {/* Add any additional content here */}
          {tasksByDate && day && Array.isArray(tasksByDate[day])
            ? tasksByDate[day].map((task) => (
                <div className="p-0.5" key={task.id}>
                  <TaskCalendarCard
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
