"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useMemo, useRef, useState } from "react";
import SearchBar from "~/app/_components/SearchBar";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import useConfirmation from "~/app/_hooks/useConfirmation";
import CreateStatusPopup from "./CreateStatusPopup";
import StatusDetailPopup from "./StatusDetailPopup";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useInvalidateQueriesAllStatuses } from "~/app/_hooks/invalidateHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import StatusTableRow from "./StatusTableRow";
import {
  permissionNumbers,
  type Permission,
} from "~/lib/types/firebaseSchemas";
import { emptyRole } from "~/lib/defaultValues/roles";
import { checkPermissions } from "~/app/_hooks/useGetPermission";

export default function StatusTable() {
  const { projectId } = useParams();
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["settings"],
      },
      role ?? emptyRole,
    );
  }, [role]);
  const utils = api.useUtils();
  const [searchValue, setSearchValue] = useState("");
  const [renderNewStatus, showNewStatus, setShowNewStatus] =
    usePopupVisibilityState();
  const [renderDetailStatus, showDetailStatus, setShowDetailStatus] =
    usePopupVisibilityState();
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const confirm = useConfirmation();
  const invalidateQueriesAllStatuses = useInvalidateQueriesAllStatuses();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { alert } = useAlert();
  const [editMode, setEditMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    data: status,
    isLoading: isLoadingTags,
    refetch: refetch,
  } = api.settings.getStatusTypes.useQuery({
    projectId: projectId as string,
  });

  const { mutateAsync: modifyStatus } =
    api.settings.modifyStatusType.useMutation();
  const { mutateAsync: deleteStatus } =
    api.settings.deleteStatusType.useMutation();
  const { mutateAsync: reorderStatus } =
    api.settings.reorderStatusTypes.useMutation();

  const handleOpenStatus = async function (statusId: string) {
    setEditMode(false);
    setSelectedStatusId(statusId);
    setShowDetailStatus(true);
  };

  const handleModifyStatus = async function (statusId: string) {
    setEditMode(true);
    setSelectedStatusId(statusId);
    setShowDetailStatus(true);
  };

  const handleDeleteStatus = async function (statusId: string) {
    const statusToDelete = status?.find((s) => s.id === statusId);

    if (
      statusToDelete &&
      ["Todo", "Doing", "Done"].includes(statusToDelete.name)
    ) {
      alert(
        "Cannot delete default status",
        `The status "${statusToDelete.name}" is a default status and cannot be deleted.`,
        {
          type: "error",
          duration: 5000,
        },
      );
      return;
    }

    if (
      await confirm(
        "Are you sure?",
        "This action will delete the status.",
        "Delete",
        "Cancel",
      )
    ) {
      await utils.settings.getStatusTypes.cancel({
        projectId: projectId as string,
      });
      utils.settings.getStatusTypes.setData(
        { projectId: projectId as string },
        (oldData) => {
          if (!oldData) return [];
          return oldData.filter((status) => status.id !== statusId);
        },
      );

      await deleteStatus({
        projectId: projectId as string,
        statusId: statusId,
      });
      await refetch();
    }
  };

  const handleToggleMarkAsDone = async (
    statusId: string,
    currentValue: boolean,
  ) => {
    const currentStatus = status?.find((s) => s.id === statusId);
    if (!currentStatus) return;

    await utils.settings.getStatusTypes.cancel({
      projectId: projectId as string,
    });

    utils.settings.getStatusTypes.setData(
      { projectId: projectId as string },
      (oldData) => {
        if (!oldData) return [];
        return oldData.map((s) => {
          if (s.id === statusId) {
            return { ...s, marksTaskAsDone: !currentValue };
          }
          return s;
        });
      },
    );

    await utils.settings.getStatusType.cancel({
      projectId: projectId as string,
      statusId: statusId,
    });

    utils.settings.getStatusType.setData(
      { projectId: projectId as string, statusId: statusId },
      (oldData) => {
        if (!oldData) return;
        return { ...oldData, marksTaskAsDone: !currentValue };
      },
    );

    await modifyStatus({
      projectId: projectId as string,
      statusId: statusId,
      status: {
        name: currentStatus.name,
        color: currentStatus.color,
        marksTaskAsDone: !currentValue,
        orderIndex: currentStatus.orderIndex,
        deleted: currentStatus.deleted,
      },
    });

    await invalidateQueriesAllStatuses(projectId as string);
    await refetch();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && filteredStatus) {
      const oldIndex = filteredStatus.findIndex(
        (item) => item.id === active.id,
      );
      const newIndex = filteredStatus.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove([...filteredStatus], oldIndex, newIndex);

        utils.settings.getStatusTypes.setData(
          { projectId: projectId as string },
          (oldData) => {
            if (!oldData) return [];
            // Create a new array with the updated orderIndex values
            const updatedStatuses = [...oldData];
            newOrder.forEach((item, index) => {
              const existingIndex = updatedStatuses.findIndex(
                (s) => s.id === item.id,
              );
              if (existingIndex !== -1) {
                updatedStatuses[existingIndex] = {
                  ...updatedStatuses[existingIndex],
                  orderIndex: index,
                } as (typeof updatedStatuses)[number];
              }
            });
            return updatedStatuses;
          },
        );

        // Send the update to the server
        await reorderStatus({
          projectId: projectId as string,
          statusIds: newOrder.map((item) => item.id),
        });

        await refetch();
      }
    }
  };

  const filteredStatus = status?.filter((status) => {
    if (
      (searchValue !== "" &&
        !status.name.toLowerCase().includes(searchValue.toLowerCase())) ||
      status.deleted
    ) {
      return false;
    }
    return true;
  });

  const sortedFilteredStatus = filteredStatus?.sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  const tableData =
    sortedFilteredStatus?.map((status, index) => ({
      id: status.id,
      order: index + 1, // (1-based index)
      name: status.name,
      color: status.color,
      markTaskAsDone: status.marksTaskAsDone,
      deleted: status.deleted,
    })) ?? [];

  const onStatusAdded = async () => {
    await invalidateQueriesAllStatuses(projectId as string);
  };

  const renderTable = () => {
    if (isLoadingTags) {
      return (
        <div className="mt-8 flex h-full w-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      );
    }

    if (tableData.length === 0) {
      return (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-app-card border-b border-app-border text-sm text-app-text/70">
              <th className="w-10 px-3 py-2"></th>
              <th className="w-[150px] px-3 py-2 text-left font-normal">
                Status Name
              </th>
              <th className="w-[100px] px-3 py-2 text-left font-normal">
                Color
              </th>
              <th className="w-[180px] px-3 py-2 text-center font-normal">
                Marks tasks as completed
              </th>
              <th className="w-[50px] px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={6}
                className="border-b border-app-border p-3 text-center text-gray-500"
              >
                <span className="text-base">No status found</span>
              </td>
            </tr>
          </tbody>
        </table>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-app-card border-b border-app-border text-sm text-app-text/70">
              <th className="w-10 px-3 py-2"></th>
              <th className="w-[150px] px-3 py-2 text-left font-normal">
                Status Name
              </th>
              <th className="w-[100px] px-3 py-2 text-left font-normal">
                Color
              </th>
              <th className="w-[180px] px-3 py-2 text-center font-normal">
                Marks tasks as completed
              </th>
              <th className="w-[50px] px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              disabled={permission < permissionNumbers.write}
              items={tableData.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {tableData.map((item) => (
                <StatusTableRow
                  disabled={permission < permissionNumbers.write}
                  key={item.id}
                  item={item}
                  onOpen={() => handleOpenStatus(item.id)}
                  onEdit={() => handleModifyStatus(item.id)}
                  onDelete={() => handleDeleteStatus(item.id)}
                  onToggleDone={() =>
                    handleToggleMarkAsDone(item.id, item.markTaskAsDone)
                  }
                  scrollContainerRef={scrollContainerRef}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="w-full">
            <SearchBar
              placeholder="Find a status..."
              searchValue={searchValue}
              handleUpdateSearch={(e) => setSearchValue(e.target.value)}
            />
          </div>
          {permission >= permissionNumbers.write && (
            <PrimaryButton
              onClick={() => setShowNewStatus(true)}
              className="whitespace-nowrap"
            >
              + Add status
            </PrimaryButton>
          )}
        </div>

        <div className="max-w-full">{renderTable()}</div>
      </div>

      {renderNewStatus && (
        <CreateStatusPopup
          showPopup={showNewStatus}
          onStatusAdded={onStatusAdded}
          setShowPopup={setShowNewStatus}
        />
      )}

      {renderDetailStatus && (
        <StatusDetailPopup
          editMode={editMode}
          setEditMode={setEditMode}
          disabled={permission < permissionNumbers.write}
          showPopup={showDetailStatus}
          setShowPopup={setShowDetailStatus}
          statusId={selectedStatusId}
        />
      )}
    </div>
  );
}
