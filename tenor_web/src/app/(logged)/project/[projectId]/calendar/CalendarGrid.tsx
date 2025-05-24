"use client";

import { useParams } from "next/navigation";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { DragDropProvider } from "@dnd-kit/react";
import CalendarCell from "./CalendarCell";
import { Timestamp } from "firebase/firestore";

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
  const utils = api.useUtils();
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

  const { mutateAsync: changeTaskDate } = api.tasks.modifyDueDate.useMutation(
    {},
  );

  const handleDragEnd = async (taskId: string, cellId: string) => {
    const newDay = parseInt(cellId);
    const targetDate = new Date(year, month, newDay);
    const targetDateTime = Timestamp.fromDate(targetDate);

    utils.tasks.getTasksByDate.setData(
      { projectId: projectId as string, month, year },
      (oldData) => {
        for (const day in oldData) {
          const tasks = oldData[parseInt(day)];
          if (Array.isArray(tasks)) {
            const taskIndex = tasks.findIndex((task) => task.id === taskId);
            if (taskIndex !== -1) {
              const task = tasks[taskIndex];
              tasks.splice(taskIndex, 1);

              if (!oldData[newDay]) {
                oldData[newDay] = [];
              }
              if (task) {
                oldData[newDay].push(task);
              }
              break;
            }
          }
        }
        return oldData;
      },
    );

    await changeTaskDate({
      projectId: projectId as string,
      taskId,
      dueDate: targetDateTime,
    });
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
      <div className="grid grid-cols-7 grid-rows-6">
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={cn(
              "h-[92px] border border-gray-300",
              !day && "bg-gray-100",
            )}
          >
            {day && (
              <CalendarCell
                day={day}
                tasksByDate={tasksByDate}
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
