"use client";

import { useEffect, useState } from "react";
import MonthSlider from "./MonthSlider";
import CalendarGrid from "./CalendarGrid";
import useQueryIdForPopup, {
  useQueryId,
} from "~/app/_hooks/useQueryIdForPopup";
import UserStoryDetailPopup from "../user-stories/UserStoryDetailPopup";
import IssueDetailPopup from "../issues/IssueDetailPopup";
import type { Task, WithId } from "~/lib/types/firebaseSchemas";
import { DatePicker } from "~/app/_components/DatePicker";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { dateToSting } from "~/utils/helpers/parsers";
import { Timestamp } from "firebase/firestore";
import CloseIcon from "@mui/icons-material/Close";
import LoadingSpinner from "~/app/_components/LoadingSpinner";

export default function ProjectCalendar() {
  const { projectId } = useParams();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const utils = api.useUtils();

  // REACT
  const [selectedTask, setTask] = useState<WithId<Task> | undefined>(undefined);
  const [forcedDetailParentUserStoryId, setForcedDetailParentUserStoryId] =
    useQueryId("id");
  const [selectedTasksId, setSelectedTasksId] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);

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

  const handleDateChange = async (tasks: string[], date: Date) => {
    if (!tasks || tasks.length === 0) return;
    utils.tasks.getTasksByDate.setData(
      { projectId: projectId as string },
      (oldData) => {
        if (!oldData) return oldData;
        const dateKey = dateToSting(date);
        if (!dateKey) return oldData;
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
  };

  return (
    <div
      className="flex h-full flex-col overflow-y-scroll"
      style={{ minHeight: 0 }}
    >
      <div className="mr-3 flex items-center justify-between pb-2">
        <h1 className="text-3xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-2">
          {selectedTasksId.length > 0 && (
            <div className="bg-primary flex items-center gap-2">
              {/* XMark */}
              <CloseIcon
                className="cursor-pointer"
                onClick={() => {
                  setSelectedTasksId([]);
                  setDate(undefined);
                }}
              />
              <PrimaryButton
                disabled={!date}
                className="max-h-8 text-xs font-semibold"
                onClick={async () => {
                  if (!date) {
                    return;
                  }
                  // date equals next day
                  const tasks = selectedTasksId;
                  const nextDay = new Date(date);
                  setSelectedTasksId([]);
                  setDate(undefined);

                  nextDay.setDate(nextDay.getDate() - 1);
                  await handleDateChange(tasks, nextDay);
                }}
              >
                Move {selectedTasksId.length} tasks to
              </PrimaryButton>
              <DatePicker
                selectedDate={date}
                onChange={(e) => {
                  setDate(e);
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
          month={month}
          year={year}
          tasksByDate={tasksByDate}
          setTask={setTask}
          setDetailItemId={setDetailItemId}
          selectedTasksId={selectedTasksId}
          setSelectedTasksId={setSelectedTasksId}
          handleDateChange={handleDateChange}
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
  );
}
