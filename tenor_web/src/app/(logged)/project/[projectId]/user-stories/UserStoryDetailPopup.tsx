"use client";

import React, { useState } from "react";
import TertiaryButton from "~/app/_components/buttons/TertiaryButton";
import Popup from "~/app/_components/Popup";
import { Size, Tag } from "~/lib/types/firebaseSchemas";
import Markdown from "react-markdown";
import PillComponent, {
  SizePillComponent,
} from "~/app/_components/PillComponent";
import TagComponent from "~/app/_components/TagComponent";
import SecondaryButton from "~/app/_components/buttons/SecondaryButton";
import PillPickerComponent from "~/app/_components/PillPickerComponent";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import { User } from "firebase/auth";
import Table, { TableColumns } from "~/app/_components/table/Table";
import { Span } from "next/dist/trace";
import ProfilePicture from "~/app/_components/ProfilePicture";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import CollapsableSearchBar from "~/app/_components/CollapsableSearchBar";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";

interface BarebonesBasicInfo {
  id: string;
  scrumId: number;
  name: string;
}

interface Task {
  id: string;
  scrumId: number;
  title: string;
  status: Tag;
  assignee?: User;
}

export interface UserStoryDetail {
  id: string;
  scrumId: number;
  name: string;
  description: string; // Markdown
  sprintName: string;
  tasks: Task[];
  complete: boolean;
  tags: Tag[];
  size: Size;
  priority: Tag;
  epic: BarebonesBasicInfo;
  acceptanceCriteria: string; // Markdown
  dependencies: BarebonesBasicInfo[];
  requiredBy: BarebonesBasicInfo[];
}

interface Props {
  userStoryId: string;
  showDetail: boolean;
  setShowDetail: (show: boolean) => void;
}

export default function UserStoryDetailPopup({
  userStoryId: _userStoryId,
  showDetail,
  setShowDetail,
}: Props) {
  const [userStoryDetail, setUserStoryDetail] = useState<UserStoryDetail>({
    id: "mockId",
    scrumId: 3,
    name: "Validate user credentials",
    description:
      "As a user, I want to enter my login credentials (username/email and password) and have them validated, so that I can access my account securely.",
    acceptanceCriteria:
      "- The system should validate the username/email and password entered by the user.\n- If the credentials are valid, the user should be redirected to their dashboard.\n- If the credentials are invalid, an error message should be displayed.",
    sprintName: "Sprint 1",
    complete: false,
    tags: [{ name: "Login", color: "#FF5733", deleted: false }],
    size: "XL",
    priority: { name: "P0", color: "#FF5733", deleted: false },
    tasks: [
      {
        id: "mockId",
        scrumId: 1,
        title: "Create login form",
        status: { name: "To Do", color: "#FF5733", deleted: false },
      },
      {
        id: "mockId2",
        scrumId: 2,
        title: "Implement validation logic",
        status: { name: "Done", color: "#4A90E2", deleted: false },
      },
    ],
    dependencies: [],
    requiredBy: [],
    epic: {
      id: "mockEpicId",
      scrumId: 1,
      name: "Login System",
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: userStoryDetail.name,
    description: userStoryDetail.description,
    acceptanceCriteria: userStoryDetail.acceptanceCriteria,
  });
  const confirm = useConfirmation();

  const [taskSearchText, setTaskSearchText] = useState("");

  const filteredTasks = userStoryDetail.tasks.filter((task) => {
    if (
      taskSearchText !== "" &&
      !task.title.toLowerCase().includes(taskSearchText.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const taskColumns: TableColumns<Task> = {
    id: { visible: false },
    scrumId: {
      label: "Id",
      width: 80,
      render(row) {
        return `TS${String(row.scrumId).padStart(3, "0")}`;
      },
    },
    title: {
      label: "Title",
      width: 280,
    },
    status: {
      label: "Status",
      width: 150,
      render(row) {
        return (
          <PillComponent
            currentTag={row.status}
            allTags={[row.status]}
            callBack={() => {}}
          >
            {row.status.name}
          </PillComponent>
        );
      },
      // filterable: "list",
      // sortable: true,
    },
    assignee: {
      label: "Assignee",
      width: 40,
      render(row) {
        return row.assignee && <ProfilePicture user={row.assignee} />;
      },
    },
  };

  const [showAcceptanceCriteria, setShowAcceptanceCriteria] = useState(false);

  return (
    <Popup
      show={showDetail}
      dismiss={async () => {
        if (editMode) {
          const confirmation = await confirm(
            "Are you sure?",
            "Your changes will be discarded.",
            "Discard changes",
            "Keep Editing",
          );
          if (!confirmation) return;
        }
        setShowDetail(false);
      }}
      size="large"
      sidebarClassName="basis-[210px]"
      sidebar={
        <>
          <h3 className="text-lg font-semibold">Epic</h3>
          <PillPickerComponent
            selectedItem={{
              id: userStoryDetail.epic.id,
              label: userStoryDetail.epic.name,
              prefix:
                "EP" + userStoryDetail.epic.scrumId.toString().padStart(3, "0"),
            }}
            allItems={[
              {
                id: "mockEpicId",
                label: "Login System",
                prefix: "EP" + "3".padStart(3, "0"),
              },
              {
                id: "asda",
                label: "User management",
                prefix: "EP" + "2".padStart(3, "0"),
              },
            ]}
            onChange={(item) => {
              setUserStoryDetail({
                ...userStoryDetail,
                epic: { id: item.id, name: item.label, scrumId: 4 },
              });
            }}
          />

          <div className="mt-4 flex gap-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Priority</h3>
              <PillComponent
                currentTag={userStoryDetail.priority}
                allTags={[userStoryDetail.priority]}
                callBack={() => {}}
                labelClassName="w-full"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Size</h3>
              <SizePillComponent
                currentSize={userStoryDetail.size}
                callback={(size) => {
                  setUserStoryDetail({ ...userStoryDetail, size: size });
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-lg font-semibold">Tags</div>
            <button className="text-2xl">+</button>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-scroll">
            <TagComponent color="#4682B4" onDelete={() => {}} expanded>
              Login
            </TagComponent>
          </div>

          <h3 className="mt-4 text-lg">
            <span className="font-semibold">Sprint: </span>Sprint 1
          </h3>

          <div className="mt-4 flex items-center justify-between">
            <h3 className="flex items-center gap-1 text-lg font-semibold">
              Dependencies <span className="text-sm font-normal">(10)</span>
            </h3>
            <button className="text-2xl">+</button>
          </div>
          <div className="grid grid-flow-row grid-cols-2 gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <TagComponent
                key={i}
                onDelete={() => console.log("DELETE")}
                className="text-left"
                data-tooltip-id="tooltip"
                data-tooltip-content="Login System"
                onClick={() => console.log("OPEN")}
              >
                US{String(i).padStart(3, "0")}
              </TagComponent>
            ))}
            <SecondaryButton className="flex h-8 items-center rounded-full text-app-primary">
              Show all
            </SecondaryButton>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <h3 className="flex items-center gap-1 text-lg font-semibold">
              Required by <span className="text-sm font-normal">(12)</span>
            </h3>
            <button className="text-2xl">+</button>
          </div>
          <div className="grid grid-flow-row grid-cols-2 gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <TagComponent key={i} onDelete={() => {}} className="text-left">
                US{String(i).padStart(3, "0")}
              </TagComponent>
            ))}
            <SecondaryButton className="flex h-8 items-center rounded-full text-app-primary">
              Show all
            </SecondaryButton>
          </div>
        </>
      }
      footer={<DeleteButton>Delete story</DeleteButton>}
      title={
        <h1 className="mb-4 text-3xl">
          <span className="font-bold">US0{userStoryDetail.scrumId}: </span>
          <span>{userStoryDetail.name}</span>
        </h1>
      }
      editMode={editMode}
      setEditMode={setEditMode}
      disablePassiveDismiss={editMode}
    >
      {editMode && (
        <>
          <InputTextField
            label="Story name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Short summary of the story..."
            className="mb-4"
          />
          <InputTextAreaField
            label="Story description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            placeholder="Explain the story in detail..."
            className="mb-4 h-36 min-h-36"
          />
          <InputTextAreaField
            label="Acceptance Criteria"
            value={editForm.acceptanceCriteria}
            onChange={(e) =>
              setEditForm({ ...editForm, acceptanceCriteria: e.target.value })
            }
            placeholder="Describe the work that needs to be done..."
            className="h-36 min-h-36"
          />
        </>
      )}
      {!editMode && (
        <div className="overflow-hidden">
          <div className="markdown-content overflow-hidden text-lg">
            <Markdown>{userStoryDetail.description}</Markdown>
          </div>

          {userStoryDetail.acceptanceCriteria !== "" && (
            <>
              <div className="mt-4 flex items-center gap-4">
                <h2 className="text-2xl font-semibold">Acceptance Criteria</h2>
                <TertiaryButton
                  onClick={() =>
                    setShowAcceptanceCriteria(!showAcceptanceCriteria)
                  }
                >
                  {showAcceptanceCriteria ? "Hide" : "Show"}
                </TertiaryButton>
              </div>
              {showAcceptanceCriteria && (
                <div className="markdown-content overflow-hidden text-lg">
                  <Markdown>{userStoryDetail.acceptanceCriteria}</Markdown>
                </div>
              )}
            </>
          )}

          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Tasks (3 / 5)</h2>
            <div className="flex items-center gap-3">
              <CollapsableSearchBar
                searchText={taskSearchText}
                setSearchText={setTaskSearchText}
              />
              <PrimaryButton>+ Add task</PrimaryButton>
            </div>
          </div>

          <Table
            data={filteredTasks}
            columns={taskColumns}
            className="font-sm mt-4 h-40"
            multiselect
          />
        </div>
      )}
    </Popup>
  );
}
