"use client";

import { cn } from "~/lib/helpers/utils";
import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import CalendarCell from "./CalendarCell";
import { dateToString } from "~/lib/helpers/parsers";

interface Props {
  editable: boolean;
  month: number;
  year: number;

  selectedDate: Date | undefined;
  setSelectedDate: (date?: Date) => void;

  tasksByDate: Record<string, WithId<Task>[]>;

  setTask: (task: WithId<Task>) => void;
  setDetailItemId: (id: string) => void;

  selectedTasksId: string[];
  setSelectedTasksId: (ids: string[]) => void;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarGrid({
  editable = false,
  month,
  year,
  selectedDate,
  setSelectedDate,
  tasksByDate,
  setTask,
  setDetailItemId,
  selectedTasksId,
  setSelectedTasksId,
}: Props) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const cells = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const dateKey = (day: number) => {
    const date = new Date(year, month, day);
    return dateToString(date);
  };

  return (
    <div className="h-full">
      <div className="grid grid-cols-7 text-left text-sm font-semibold">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div
        className={cn(
          "grid h-[calc(80vh-100px)] grid-cols-7 overflow-y-scroll",
        )}
      >
        {cells.map((day, idx) => (
          <div
            key={day ? dateKey(day) : idx.toString()}
            className={cn(
              "h-full border border-gray-300",
              !day && "bg-gray-200",
            )}
          >
            {day && (
              <CalendarCell
                editable={editable}
                day={day}
                month={month}
                year={year}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                tasks={tasksByDate?.[dateKey(day)!] ?? []}
                selectedTasksId={selectedTasksId}
                setSelectedTasksId={setSelectedTasksId}
                setTask={setTask}
                setDetailItemId={setDetailItemId}
                largeCell={cells.length < 42}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
