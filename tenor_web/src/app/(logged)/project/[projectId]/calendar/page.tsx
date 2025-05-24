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

export default function ProjectCalendar() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  // REACT
  const [selectedTask, setTask] = useState<WithId<Task> | undefined>(undefined);
  const [forcedDetailParentUserStoryId, setForcedDetailParentUserStoryId] =
    useQueryId("id");

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

  return (
    <div className="flex flex-col">
      <div className="flex justify-between pb-2">
        <h1 className="text-3xl font-semibold">Calendar</h1>
        <MonthSlider
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
        />
      </div>
      <CalendarGrid
        month={month}
        year={year}
        setTask={setTask}
        setDetailItemId={setDetailItemId}
      />

      {renderDetail && detailItemType === "US" && detailParentItemId && (
        <UserStoryDetailPopup
          setUserStoryId={(newId) => {
            if (newId === "") {
              setDetailItemId("");
              if (forcedDetailParentUserStoryId) {
                setShowDetail(false);
                setTimeout(() => {
                  setForcedDetailParentUserStoryId("");
                  // setShowDetail(false);
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
