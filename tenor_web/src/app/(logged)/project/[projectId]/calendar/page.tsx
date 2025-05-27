"use client";

import { useEffect, useMemo, useState } from "react";
import MonthSlider from "./MonthSlider";
import CalendarGrid from "./CalendarGrid";
import useQueryIdForPopup, {
  useQueryId,
} from "~/app/_hooks/useQueryIdForPopup";
import UserStoryDetailPopup from "../user-stories/UserStoryDetailPopup";
import IssueDetailPopup from "../issues/IssueDetailPopup";
import {
  permissionNumbers,
  type Permission,
  type Task,
  type WithId,
} from "~/lib/types/firebaseSchemas";
import { DatePicker } from "~/app/_components/DatePicker";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { dateToString } from "~/utils/helpers/parsers";
import { Timestamp } from "firebase/firestore";
import CloseIcon from "@mui/icons-material/Close";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { DragDropProvider } from "@dnd-kit/react";
import { useInvalidateQueriesTaskDetails } from "~/app/_hooks/invalidateHooks";
import { checkPermissions, emptyRole } from "~/lib/defaultProjectValues";

export default function ProjectCalendar() {
  // GENERAL
  const { projectId } = useParams();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const utils = api.useUtils();

  // UTILS
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();

  // REACT
  const [selectedTask, setTask] = useState<WithId<Task> | undefined>(undefined);
  const [forcedDetailParentUserStoryId, setForcedDetailParentUserStoryId] =
    useQueryId("id");
  const [selectedTasksId, setSelectedTasksId] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [
    renderDetail,
    showDetail,
    detailItemId,
    setDetailItemId,
    setShowDetail,
  ] = useQueryIdForPopup("ts");
  // Detail item and parent
  const detailItemType = forcedDetailParentUserStoryId
    ? "US"
    : selectedTask?.itemType;
  const detailParentItemId =
    forcedDetailParentUserStoryId ?? selectedTask?.itemId;

  useEffect(() => {
    if (forcedDetailParentUserStoryId) {
      setShowDetail(true);
    }
  }, [forcedDetailParentUserStoryId]);

  // TRCP
  const { data: tasksByDate } = api.tasks.getTasksByDate.useQuery({
    projectId: projectId as string,
  });
  const { mutateAsync: changeTaskDate } = api.tasks.modifyDueDate.useMutation();

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["issues"],
      },
      role ?? emptyRole,
    );
  }, [role]);

  const handleDateChange = async (tasks: string[], date: Date) => {
    utils.tasks.getTasksByDate.setData(
      { projectId: projectId as string },
      (oldData) => {
        if (!oldData) return oldData;

        // get key of the date in the format YYYY-MM-DD
        const dateKey = dateToString(date);
        if (!dateKey) return oldData;

        // if the dateKey does not exist in oldData, create it
        if (!oldData[dateKey]) {
          oldData[dateKey] = [];
        }

        const newData: Record<string, WithId<Task>[]> = {};
        newData[dateKey] = oldData[dateKey] ?? [];
        for (const key in oldData) {
          if (key === dateKey) {
            continue;
          }
          newData[key] =
            oldData[key]?.filter((task) => !tasks.includes(task.id)) ?? [];
          // append the tasks that were filtered out
          newData[dateKey].push(
            ...(oldData[key]?.filter((task) => tasks.includes(task.id)) ?? []),
          );
        }
        return newData;
      },
    );

    await Promise.all(
      tasks.map((taskId) =>
        changeTaskDate({
          projectId: projectId as string,
          taskId,
          dueDate: Timestamp.fromDate(date),
        }),
      ),
    );

    await invalidateQueriesTaskDetails(projectId as string, tasks);
  };

  // FIXME: Enable feature
  const handleDragEnd = async (taskId: string, cellId: string) => {
    const targetDate = new Date(cellId);
    if (handleDateChange) {
      await handleDateChange([taskId], targetDate);
    }
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
      <div
        className="flex h-full flex-col overflow-y-scroll"
        style={{ minHeight: 0 }}
      >
        <div className="mr-3 flex items-center justify-between pb-2">
          <h1 className="text-3xl font-semibold">Calendar</h1>
          <div className="flex items-center gap-2">
            {(selectedTasksId.length > 0 || selectedDate) && (
              <div className="bg-primary flex items-center gap-2">
                <CloseIcon
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTasksId([]);
                    setSelectedDate(undefined);
                  }}
                />
                <PrimaryButton
                  disabled={!selectedDate || selectedTasksId.length === 0}
                  className="max-h-8 text-xs font-semibold"
                  onClick={async () => {
                    if (!selectedDate) {
                      return;
                    }

                    const tasks = selectedTasksId;
                    const date = selectedDate;

                    setSelectedTasksId([]);
                    setSelectedDate(undefined);

                    setMonth(date.getMonth());
                    setYear(date.getFullYear());

                    await handleDateChange(tasks, date);
                  }}
                >
                  Move {selectedTasksId.length} tasks to
                </PrimaryButton>
                <DatePicker
                  selectedDate={selectedDate}
                  onChange={(date) => {
                    if (!date) {
                      setSelectedDate(date);
                      return;
                    }
                    // truncate to start of the day
                    date = new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                    );
                    setSelectedDate(date);
                  }}
                  className="max-h-8 bg-white text-xs"
                />
              </div>
            )}
            <MonthSlider
              month={month}
              setMonth={setMonth}
              year={year}
              setYear={setYear}
            />
          </div>
        </div>
        {tasksByDate ? (
          <CalendarGrid
            editable={permission >= permissionNumbers.write}
            tasksByDate={tasksByDate}
            month={month}
            year={year}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setTask={setTask}
            setDetailItemId={setDetailItemId}
            selectedTasksId={selectedTasksId}
            setSelectedTasksId={setSelectedTasksId}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner color="primary" />
          </div>
        )}

        {renderDetail && detailItemType === "US" && detailParentItemId && (
          <UserStoryDetailPopup
            setUserStoryId={(newId) => {
              if (newId === "") {
                setDetailItemId("");
                if (forcedDetailParentUserStoryId) {
                  setShowDetail(false);
                  setTimeout(() => {
                    setForcedDetailParentUserStoryId("");
                    setShowDetail(false);
                  }, 500);
                }
              } else {
                // User wants to open a new user story (like by clicking on a link in the dependency list)
                setForcedDetailParentUserStoryId(newId);
              }
            }}
            showDetail={showDetail}
            userStoryId={detailParentItemId}
            taskIdToOpenImmediately={detailItemId}
          />
        )}

        {renderDetail && detailItemType === "IS" && detailParentItemId && (
          <IssueDetailPopup
            setDetailId={setDetailItemId}
            showDetail={showDetail}
            issueId={detailParentItemId}
            taskIdToOpenImmediately={detailItemId}
          />
        )}
      </div>
    </DragDropProvider>
  );
}
