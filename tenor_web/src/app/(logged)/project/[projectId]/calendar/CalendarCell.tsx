import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { TaskCalendarCard } from "./TaskCalendarCard";
import { useDroppable } from "@dnd-kit/react";
import { cn } from "~/lib/utils";
import { dateToString } from "~/utils/helpers/parsers";

interface Props {
  day: number;
  month: number;
  year: number;
  tasks: WithId<Task>[];

  selectedDate: Date | undefined;
  setSelectedDate: (date?: Date) => void;

  setTask: (task: WithId<Task>) => void;
  setDetailItemId: (id: string) => void;

  selectedTasksId: string[];
  setSelectedTasksId: (ids: string[]) => void;
}

export default function CalendarCell({
  day,
  month,
  year,
  tasks,
  selectedDate,
  setSelectedDate,
  setTask,
  setDetailItemId,
  selectedTasksId,
  setSelectedTasksId,
}: Props) {
  const date = new Date(year, month, day);
  const { ref, isDropTarget } = useDroppable({
    id: dateToString(date)!,
    // FIXME: Enable feature
    disabled: true,
  });
  return (
    <div
      className={cn(
        "flex h-full w-full",
        isDropTarget && "bg-gray-100",
        selectedDate &&
          date.getTime() === selectedDate.getTime() &&
          "bg-app-secondary",
      )}
    >
      <div className="flex h-full w-full p-0.5" ref={ref}>
        <span
          className={cn("h-full p-1 text-xs", tasks.length == 0 && "w-full")}
          onClick={() => {
            if (selectedDate && date === selectedDate) {
              setSelectedDate(undefined);
              return;
            }
            setSelectedDate(date);
          }}
        >
          {day}
        </span>
        <div
          className={cn(
            "flex flex-col overflow-y-auto",
            tasks.length > 0 && "w-full",
          )}
        >
          {tasks.map((task) => (
            <div className="p-0.5" key={task.id}>
              <TaskCalendarCard
                task={task}
                selectedTasksId={selectedTasksId}
                setSelectedTasksId={setSelectedTasksId}
                setTask={setTask}
                setDetailItemId={setDetailItemId}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
