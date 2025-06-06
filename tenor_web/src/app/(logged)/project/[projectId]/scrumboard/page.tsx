"use client";

import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import TasksKanban from "./TasksKanban";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import { useInvalidateQueriesAllTasks } from "~/app/_hooks/invalidateHooks";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import ItemsKanban from "./ItemsKanban";
import {
  permissionNumbers,
  type Permission,
} from "~/lib/types/firebaseSchemas";
import { api } from "~/trpc/react";
import SearchBar from "~/app/_components/inputs/search/SearchBar";
import { emptyRole } from "~/lib/defaultValues/roles";
import { checkPermissions } from "~/lib/defaultValues/permission";
import AdvancedSearch from "../../../../_components/inputs/search/AdvancedSearch";
import useAdvancedSearchFilters from "~/app/_hooks/useAdvancedSearchFilters";
import CreateStatusPopup from "../settings/tags-scrumboard/CreateStatusPopup";

type ScrumboardSections = "Tasks" | "Backlog Items";

export default function ProjectKanban() {
  const { projectId } = useParams();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

  const { data: sprint } = api.sprints.getActiveSprint.useQuery({
    projectId: projectId as string,
  });

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

  const [advancedFilters, setAdvancedFilters] =
    useAdvancedSearchFilters("scrumboard");
  useMemo(() => {
    if (sprint) {
      setAdvancedFilters({
        ...advancedFilters,
        sprint,
      });
    }
  }, [sprint]);

  // HANDLES
  const onListAdded = async () => {
    await invalidateQueriesAllTasks(projectId as string);
    setShowNewList(false);
  };

  return (
    <div className="m-6 flex-1 overflow-hidden p-4">
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
              advancedFilters={advancedFilters}
              setAdvancedFilters={setAdvancedFilters}
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
            advancedFilters={advancedFilters}
          ></TasksKanban>
        )}
        {section === "Backlog Items" && (
          <ItemsKanban
            filter={filter}
            advancedFilters={advancedFilters}
          ></ItemsKanban>
        )}

        {renderNewList && (
          <CreateStatusPopup
            showPopup={showNewList}
            setShowPopup={setShowNewList}
            onStatusAdded={onListAdded}
          />
        )}
      </div>
    </div>
  );
}
