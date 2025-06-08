import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { TaskCalendarCard } from "./TaskCalendarCard";
import { useDroppable } from "@dnd-kit/react";
import { cn } from "~/lib/helpers/utils";
import { dateToString } from "~/lib/helpers/parsers";
import { startOfDay, endOfDay } from "~/lib/helpers/parsers";

interface Props {
  editable: boolean;
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

  largeCell?: boolean;
}

export default function CalendarCell({
  editable,
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
  largeCell = false,
}: Props) {
  const date = new Date(year, month, day);
  const { ref, isDropTarget } = useDroppable({
    id: dateToString(date)!,
    // FIXME: Enable feature
    disabled: true,
  });

  const setNewSelectedDate = (date: Date) => {
    if (!editable) return;

    const normalizedDate = startOfDay(date);
    const normalizedSelected = selectedDate ? startOfDay(selectedDate) : null;

    if (
      normalizedSelected &&
      normalizedDate.getTime() === normalizedSelected.getTime()
    ) {
      setSelectedDate(undefined);
      return;
    }

    const endOfDayDate = endOfDay(
      new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    setSelectedDate(endOfDayDate);
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-[40px] w-full",
        isDropTarget && "bg-gray-100",
        selectedDate &&
          startOfDay(date).getTime() === startOfDay(selectedDate).getTime()
          ? "bg-app-secondary"
          : "hover:bg-gray-100",
      )}
    >
      <div className="flex h-full w-full flex-col p-0.5 lg:flex-row" ref={ref}>
        <span
          className={cn(
            "p-1 text-xs lg:h-full",
            tasks.length == 0 && "w-full",
            selectedDate &&
              startOfDay(date).getTime() ===
                startOfDay(selectedDate).getTime() &&
              "text-white",
          )}
          onClick={() => {
            setNewSelectedDate(date);
          }}
        >
          {day}
        </span>
        <div
          className={cn(
            "flex h-[10vh] flex-col overflow-y-auto",
            tasks.length > 0 && "w-full",
            largeCell && "h-[12vh]",
          )}
        >
          {tasks.map((task) => (
            <div className="p-0.5" key={task.id}>
              <TaskCalendarCard
                editable={editable}
                task={task}
                selectedTasksId={selectedTasksId}
                setSelectedTasksId={setSelectedTasksId}
                setTask={setTask}
                setDetailItemId={setDetailItemId}
                dateSelected={!!selectedDate}
              />
            </div>
          ))}
          <div
            className="h-full"
            onClick={() => {
              setNewSelectedDate(date);
            }}
          />
        </div>
      </div>
    </div>
  );
}
