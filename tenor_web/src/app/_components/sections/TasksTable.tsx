"use client";

import React, { useState } from "react";
import type { TaskPreview } from "~/lib/types/detailSchemas";
import Table, { type TableColumns } from "../table/Table";
import ProfilePicture from "../ProfilePicture";
import PillComponent from "../PillComponent";
import type { User } from "firebase/auth";
import PrimaryButton from "../buttons/PrimaryButton";
import CollapsableSearchBar from "../CollapsableSearchBar";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import { SidebarPopup } from "../Popup";
import { CreateTaskForm } from "../tasks/CreateTaskPopup";
import { api } from "~/trpc/react";
import StatusPicker from "../specific-pickers/StatusPicker";
import { useParams } from "next/navigation";
import { type Tag } from "~/lib/types/firebaseSchemas";

interface Props {
  tasks: TaskPreview[];
  itemId: string;
  itemType: "US" | "IS" | "IT";
  onTaskStatusChange: (
    taskId: string,
    statusId: Tag,) => void;
}

export default function TasksTable({ tasks, itemId, itemType, onTaskStatusChange }: Props) {
  const [taskSearchText, setTaskSearchText] = useState("");
  const [showAddTaskPopup, setShowAddTaskPopup] = useState(false);

  const { projectId } = useParams();  
  
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
  
  const completedTasks = tasks.filter(task => 
    task.status?.name === "Done"
  ).length;
  
  const taskColumns: TableColumns<TaskPreview> = {
    id: { visible: false },
    scrumId: {
      label: "Id",
      width: 100,
      render(row) {
        return formatTaskScrumId(row.scrumId);
      },
    },
    name: {
      label: "Title",
      width: 200,
    },
    status: {
      label: "Status",
      width: 150,
      render(row) {

        return(
          <StatusPicker
            status={row.status}
            onChange={ async (status) => {
            onTaskStatusChange (
                row.id,
                status
              )
            }}
            className = "w-32"
          />
        )
      },
    },
    assignee: {
      label: "Assignee",
      width: 100,
      render(row) {
        if (!row.assignee) {
          return <div></div>;
        }
        return (
          <div>
            {row.assignee && (
              <ProfilePicture 
                user={row.assignee} 
              />
            )}
          </div>
        );
      },
    },
  };

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
      
      <div className="mt-4 w-full max-w-full">
        <Table
          data={filteredTasks}
          columns={taskColumns}
          className="font-sm w-full table-fixed overflow-visible rounded-lg border border-gray-100"
          multiselect
          deletable
          onDelete={(ids) =>{

          }  }
          emptyMessage={tasks.length > 0 ? "No tasks found" : "No tasks yet"}
        />
      </div>
      
      <SidebarPopup 
        show={showAddTaskPopup}
        dismiss={() => setShowAddTaskPopup(false)}
      >
        <CreateTaskForm 
          itemId={itemId} 
          itemType={itemType} 
          onTaskAdded={() => setShowAddTaskPopup(false)} 
        />
      </SidebarPopup>
    </>
  );
}

