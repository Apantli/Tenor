"use client";

import { cn } from "~/lib/utils";
import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { DragDropProvider } from "@dnd-kit/react";
import CalendarCell from "./CalendarCell";
import { dateToSting } from "~/utils/helpers/parsers";

interface Props {
  month: number;
  year: number;

  tasksByDate?: Record<string, WithId<Task>[]>;

  setTask?: (task: WithId<Task>) => void;
  setDetailItemId?: (id: string) => void;

  selectedTasksId?: string[];
  setSelectedTasksId?: (ids: string[]) => void;

  handleDateChange?: (tasks: string[], date: Date) => Promise<void>;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarGrid({
  month,
  year,
  tasksByDate,
  setTask,
  setDetailItemId,
  selectedTasksId,
  setSelectedTasksId,
  handleDateChange,
}: Props) {
  // const utils = api.useUtils();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Fill the grid: empty cells before, days, then empty cells after
  const cells = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const handleDragEnd = async (taskId: string, cellId: string) => {
    const targetDate = new Date(year, month, parseInt(cellId));
    if (handleDateChange) {
      await handleDateChange([taskId], targetDate);
    }
  };

  const dateKey = (day: number) => {
    const date = new Date(year, month, day);
    return dateToSting(date);
  };

  return (
    <DragDropProvider
      onDragEnd={async (event) => {
        const { operation, canceled } = event;
        const { source, target } = operation;

        if (!source || canceled || !target) {
          return;
        }

        await handleDragEnd(source.id as string, target.id as string);
      }}
    >
      <div className="grid grid-cols-7 text-left text-sm font-semibold">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className={cn("grid grid-cols-7")}>
        {cells.map((day, idx) => (
          <div
            key={day ? dateKey(day) : idx.toString()}
            className={cn(
              "h-[108px] border border-gray-300",
              !day && "bg-gray-100",
            )}
          >
            {day && (
              <CalendarCell
                day={day}
                tasks={tasksByDate?.[dateKey(day)!] ?? []}
                selectedTasksId={selectedTasksId}
                setSelectedTasksId={setSelectedTasksId}
                setTask={setTask}
                setDetailItemId={setDetailItemId}
              />
            )}
          </div>
        ))}
      </div>
    </DragDropProvider>
  );
}
