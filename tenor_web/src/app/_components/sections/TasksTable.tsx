"use client";

import React, { useState } from "react";
import type { TaskPreview } from "~/lib/types/detailSchemas";
import Table, { type TableColumns } from "../table/Table";
import PillComponent from "../PillComponent";
import ProfilePicture from "../ProfilePicture";
import type { User } from "firebase/auth";
import PrimaryButton from "../buttons/PrimaryButton";
import CollapsableSearchBar from "../CollapsableSearchBar";
import { useFormatTaskScrumId } from "~/app/_hooks/scumIdHooks";
import { SidebarPopup } from "../Popup";
import { CreateTaskForm } from "../tasks/CreateTaskPopup";

interface Props {
  tasks: TaskPreview[];
  userStoryId?: string; 
}

export default function TasksTable({ tasks, userStoryId }: Props) {
  const [taskSearchText, setTaskSearchText] = useState("");
  const [showAddTaskPopup, setShowAddTaskPopup] = useState(false);
  
  const filteredTasks = tasks.filter((task) => {
    if (
      taskSearchText !== "" &&
      !task.name.toLowerCase().includes(taskSearchText.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
  
  const formatTaskScrumId = useFormatTaskScrumId();
  
  const taskColumns: TableColumns<TaskPreview> = {
    // Your existing columns definition
    id: { visible: false },
    scrumId: {
      label: "Id",
      width: 80,
      render(row) {
        return formatTaskScrumId(row.scrumId);
      },
    },
    name: {
      label: "Title",
      width: 280,
    },
    status: {
      label: "Status",
      width: 150,
      render(row) {
        return (
          <PillComponent
            labelClassName=""
            currentTag={row.status}
            allTags={[row.status]}
            callBack={() => {}}
          >
            {row.status.name}
          </PillComponent>
        );
      },
    },
    assignee: {
      label: "Assignee",
      width: 80,
      render(row) {
        return (
          row.assignee && (
            <ProfilePicture user={row.assignee as User} hideTooltip />
          )
        );
      },
    },
  };
  
  // Calculate completed tasks
  const completedTasks = tasks.filter(task => task.status?.name === "Done").length;

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Tasks ({completedTasks} / {tasks.length})
        </h2>
        <div className="flex items-center gap-3">
          {tasks.length > 0 && (
            <CollapsableSearchBar
              searchText={taskSearchText}
              setSearchText={setTaskSearchText}
            />
          )}
          <PrimaryButton onClick={() => setShowAddTaskPopup(true)}>
            + Add task
          </PrimaryButton>
        </div>
      </div>
      
      <Table
        data={filteredTasks}
        columns={taskColumns}
        className="font-sm mt-4 h-40 w-full overflow-hidden"
        multiselect
        emptyMessage={tasks.length > 0 ? "No tasks found" : "No tasks yet"}
      />
      
      <SidebarPopup 
        show={showAddTaskPopup}
        dismiss={() => setShowAddTaskPopup(false)}
      >
        <CreateTaskForm />
      </SidebarPopup>
    </>
  );
}

