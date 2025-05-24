"use client";

import { useParams } from "next/navigation";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { TaskCalendarCard } from "./TaskCalendarCard";
import type { Task, WithId } from "~/lib/types/firebaseSchemas";

interface Props {
  month: number;
  year: number;

  setTask?: (task: WithId<Task>) => void;
  setDetailItemId?: (id: string) => void;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarGrid({
  month,
  year,
  setTask,
  setDetailItemId,
}: Props) {
  const { projectId } = useParams();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const totalCells = 42; // 6 rows * 7 columns (max possible in a month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Fill the grid: empty cells before, days, then empty cells after
  const cells = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...days,
  ];
  while (cells.length < totalCells) {
    cells.push(null);
  }

  const { data: tasksByDate } = api.tasks.getTasksByDate.useQuery({
    projectId: projectId as string,
    month,
    year,
  });

  return (
    <div>
      <div className="grid grid-cols-7 text-left text-sm font-semibold">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={cn(
              "h-[92px] border border-gray-300 p-0.5",
              !day && "bg-gray-100",
            )}
          >
            {day && (
              <div className="flex w-full">
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

                {/* Add more task details or actions here */}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
