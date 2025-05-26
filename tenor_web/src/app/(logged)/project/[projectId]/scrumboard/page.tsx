"use client";

import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import TasksKanban from "./TasksKanban";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import { useInvalidateQueriesAllTasks } from "~/app/_hooks/invalidateHooks";
import { useParams } from "next/navigation";
import CreateKanbanListPopup from "./CreateKanbanListPopup";
import { useMemo, useState } from "react";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import ItemsKanban from "./ItemsKanban";
import {
  permissionNumbers,
  type Sprint,
  type Tag,
  type WithId,
  type Permission,
} from "~/lib/types/firebaseSchemas";
import { checkPermissions, emptyRole } from "~/lib/defaultProjectValues";
import { api } from "~/trpc/react";
import SearchBar from "~/app/_components/SearchBar";
import AdvancedSearch from "../../../../_components/AdvancedSearch";
import { type UserPreview } from "~/lib/types/detailSchemas";

type ScrumboardSections = "Tasks" | "Backlog Items";

export default function ProjectKanban() {
  const { projectId } = useParams();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

  // TRPC
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["backlog"],
      },
      role ?? emptyRole,
    );
  }, [role]);

  // REACT
  const [renderNewList, showNewList, setShowNewList] =
    usePopupVisibilityState();
  const [section, setSection] = useState<ScrumboardSections>(
    (localStorage.getItem("scrumboard-section") as ScrumboardSections) ??
      "Tasks",
  );
  const [filter, setFilter] = useState("");

  const [tags, setTags] = useState<WithId<Tag>[]>([]);
  const [size, setSizes] = useState<WithId<Tag>[]>([]);
  const [priorities, setPriorities] = useState<WithId<Tag>[]>([]);

  const [assignee, setAssignee] = useState<WithId<UserPreview> | undefined>(
    undefined,
  );
  const [sprint, setSprint] = useState<WithId<Sprint> | undefined>(undefined);

  // HANDLES
  const onListAdded = async () => {
    await invalidateQueriesAllTasks(projectId as string);
    setShowNewList(false);
  };

  return (
    <div className="flex h-full flex-col justify-start overflow-hidden pt-0">
      <div className="flex items-baseline justify-between gap-3 pb-4">
        <h1 className="grow-[1] text-3xl font-semibold">Scrum Board</h1>
        <div className="flex w-[400px] gap-2 pl-3">
          <SearchBar
            handleUpdateSearch={(e) => setFilter(e.target.value)}
            searchValue={filter}
            placeholder="Search..."
          />
          <AdvancedSearch
            tags={tags}
            setTags={setTags}
            priorities={priorities}
            setPriorities={setPriorities}
            size={size}
            setSizes={setSizes}
            assignee={assignee}
            setAssignee={setAssignee}
            sprint={sprint}
            setSprint={setSprint}
          />
        </div>

        <div className="min-w-[300px]">
          <SegmentedControl
            options={["Tasks", "Backlog Items"]}
            selectedOption={section}
            onChange={(value) => {
              setSection(value as ScrumboardSections);
              localStorage.setItem("scrumboard-section", value);
            }}
          />
        </div>

        {permission >= permissionNumbers.write && (
          <PrimaryButton onClick={() => setShowNewList(true)}>
            + Add list
          </PrimaryButton>
        )}
      </div>

      {section === "Tasks" && (
        <TasksKanban
          filter={filter}
          priorities={priorities}
          tags={tags}
          size={size}
          assignee={assignee}
          sprint={sprint}
        ></TasksKanban>
      )}
      {section === "Backlog Items" && (
        <ItemsKanban
          filter={filter}
          priorities={priorities}
          tags={tags}
          size={size}
          assignee={assignee}
          sprint={sprint}
        ></ItemsKanban>
      )}

      {renderNewList && (
        <CreateKanbanListPopup
          onListAdded={onListAdded}
          showPopup={showNewList}
          setShowPopup={setShowNewList}
        />
      )}
    </div>
  );
}
