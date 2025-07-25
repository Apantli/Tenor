"use client";

import { useEffect, useMemo, useState } from "react";
import MonthSlider from "./MonthSlider";
import CalendarGrid from "./CalendarGrid";
import useQueryIdForPopup, {
  useQueryId,
} from "~/app/_hooks/useQueryIdForPopup";
import UserStoryDetailPopup from "../../../../_components/popups/UserStoryDetailPopup";
import IssueDetailPopup from "../../../../_components/popups/IssueDetailPopup";
import BacklogItemDetailPopup from "~/app/_components/popups/BacklogItemDetailPopup";
import {
  permissionNumbers,
  type Permission,
  type Task,
  type WithId,
} from "~/lib/types/firebaseSchemas";
import { DatePicker } from "~/app/_components/inputs/pickers/DatePicker";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { dateToString, startOfDay } from "~/lib/helpers/parsers";
import { Timestamp } from "firebase/firestore";
import CloseIcon from "@mui/icons-material/Close";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { DragDropProvider } from "@dnd-kit/react";
import { useInvalidateQueriesTaskDetails } from "~/app/_hooks/invalidateHooks";
import { emptyRole } from "~/lib/defaultValues/roles";
import { checkPermissions } from "~/lib/defaultValues/permission";

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
    const startOfDayDate = startOfDay(
      new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    );

    utils.tasks.getTasksByDate.setData(
      { projectId: projectId as string },
      (oldData) => {
        if (!oldData) return oldData;
        const targetDateKey = dateToString(startOfDayDate);
        if (!targetDateKey) return oldData;

        const newTasksByDate: Record<string, WithId<Task>[]> = {};
        const tasksToMoveDetails: WithId<Task>[] = [];

        for (const dayKey in oldData) {
          if (!oldData[dayKey]) continue;
          newTasksByDate[dayKey] = [];
          for (const task of oldData[dayKey]) {
            if (tasks.includes(task.id)) {
              tasksToMoveDetails.push({
                ...task,
                dueDate: Timestamp.fromDate(startOfDayDate).toDate(),
              });
            } else {
              newTasksByDate[dayKey].push(task);
            }
          }
          if (newTasksByDate[dayKey].length === 0) {
            delete newTasksByDate[dayKey];
          }
        }

        if (!newTasksByDate[targetDateKey]) {
          newTasksByDate[targetDateKey] = [];
        }
        newTasksByDate[targetDateKey].push(...tasksToMoveDetails);

        return newTasksByDate;
      },
    );

    await Promise.all(
      tasks.map((taskId) =>
        changeTaskDate({
          projectId: projectId as string,
          taskId,
          dueDate: Timestamp.fromDate(startOfDayDate),
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
    <div className="m-6 flex-1 p-4">
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
                      const startOfDayDateValue = startOfDay(
                        new Date(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate(),
                        ),
                      );
                      setSelectedDate(startOfDayDateValue);
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

          {renderDetail && detailItemType === "IT" && detailParentItemId && (
            <BacklogItemDetailPopup
              setDetailId={setDetailItemId}
              showDetail={showDetail}
              backlogItemId={detailParentItemId}
              taskIdToOpenImmediately={detailItemId}
            />
          )}
        </div>
      </DragDropProvider>
    </div>
  );
}
