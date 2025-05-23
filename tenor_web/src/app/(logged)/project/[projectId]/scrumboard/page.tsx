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
  type Permission,
} from "~/lib/types/firebaseSchemas";
import { checkPermissions, emptyRole } from "~/lib/defaultProjectValues";
import { api } from "~/trpc/react";
import SearchBar from "~/app/_components/SearchBar";
import AdvancedSearch, { type RegexItem } from "./AdvancedSearch";

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
  const [regex, setRegex] = useState<RegexItem[]>([]);

  // HANDLES
  const onListAdded = async () => {
    await invalidateQueriesAllTasks(projectId as string);
    setShowNewList(false);
  };

  return (
    <div className="flex h-full flex-col justify-start overflow-hidden pt-0">
      <div className="flex items-baseline justify-between gap-3 pb-4">
        <h1 className="grow-[1] text-3xl font-semibold">Scrum Board</h1>
        <div className="flex max-w-[400px] gap-2 pl-3">
          <SearchBar
            handleUpdateSearch={(e) => setFilter(e.target.value)}
            searchValue={filter}
            placeholder="Search..."
          />
          <AdvancedSearch regex={regex} setRegex={setRegex} />
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
        <TasksKanban filter={filter} regex={regex}></TasksKanban>
      )}
      {section === "Backlog Items" && (
        <ItemsKanban filter={filter} regex={regex}></ItemsKanban>
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
