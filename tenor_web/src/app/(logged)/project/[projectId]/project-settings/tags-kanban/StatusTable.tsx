"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useRef, useState } from "react";
import SearchBar from "~/app/_components/SearchBar";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import TagComponent from "~/app/_components/TagComponent";
import useConfirmation from "~/app/_hooks/useConfirmation";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import CreateStatusPopup from "./CreateStatusPopup";
import StatusDetailPopup from "./StatusDetailPopup";
import { useInvalidateQueriesAllStatuses } from "~/app/_hooks/invalidateHooks";
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

interface StatusItem {
  id: string;
  name: string;
  color: string;
  markTaskAsDone: boolean;
  deleted: boolean;
  order: number;
}

export default function StatusTable() {
  const { projectId } = useParams();
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

  const handleModifyStatus = async function (statusId: string) {
    setSelectedStatusId(statusId);
    setShowDetailStatus(true);
  };

  const handleDeleteStatus = async function (statusId: string) {
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
            return newOrder.map((item, index) => ({
              ...item,
              orderIndex: index,
            }));
          },
        );

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

  const tableData =
    filteredStatus?.map((status) => ({
      id: status.id,
      order: status.orderIndex + 1,
      name: status.name,
      color: status.color,
      markTaskAsDone: status.marksTaskAsDone,
      deleted: status.deleted,
    })) ?? [];

  const columns = {
    id: { visible: false },
    order: {
      label: "Order",
      width: 100,
      filterable: "search-only",
      sortable: true,
      sorter: (a: { order: number }, b: { order: number }) =>
        a.order > b.order ? 1 : -1,
    },
    name: {
      label: "Status Name",
      width: 150,
      filterable: "search-only",
      sortable: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render(row) {
        return (
          <button
            className="w-full truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
            onClick={() => {
              setSelectedStatusId(row.id);
              setShowDetailStatus(true);
            }}
          >
            {row.name}
          </button>
        );
      },
    },
    color: {
      label: "Color",
      width: 100,
      render: (row) => (
        <TagComponent color={row.color} reducedPadding className="min-w-8">
          {row.color}
        </TagComponent>
      ),
    },
    markTaskAsDone: {
      label: "Marks tasks as completed",
      width: 180,
      render: (row: { id: string; markTaskAsDone: boolean }) => (
        <div className="flex h-full w-full items-center justify-center">
          <div
            className="flex items-center justify-center"
            style={{ margin: "0 auto" }}
          >
            <InputCheckbox
              checked={row.markTaskAsDone}
              onChange={() =>
                handleToggleMarkAsDone(row.id, row.markTaskAsDone)
              }
              className="m-0 cursor-pointer"
            />
          </div>
        </div>
      ),
    },
    deleted: { visible: false },
  } as TableColumns<StatusItem>;

  const extraOptions = [
    {
      label: "Edit",
      icon: <MoreHorizIcon />,
      action: (ids: string[]) => {
        if (ids.length === 1 && ids[0]) {
          void handleModifyStatus(ids[0]);
        }
      },
    },
  ];

  const onStatusAdded = async () => {
    await invalidateQueriesAllStatuses(projectId as string);
  };

  const renderTable = () => {
    if (isLoadingTags) {
      return <div className="py-4 text-center">Loading tags...</div>;
    }

    if (tableData.length === 0) {
      return <div className="py-4 text-center">No status found</div>;
    }

    return (
      <div ref={scrollContainerRef} className="max-w-[750px] overflow-auto">
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
                <th className="w-[100px] px-3 py-2 text-left font-normal">
                  Order
                </th>
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
                items={tableData.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {tableData.map((item) => (
                  <StatusTableRow
                    key={item.id}
                    item={item}
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
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex max-w-[750px] items-center justify-between gap-4">
          <div className="w-[700px]">
            <SearchBar
              placeholder="Find a status..."
              searchValue={searchValue}
              handleUpdateSearch={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <PrimaryButton
            onClick={() => setShowNewStatus(true)}
            className="whitespace-nowrap"
          >
            + Add status
          </PrimaryButton>
        </div>

        <div className="max-w-[750px]">{renderTable()}</div>
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
          showPopup={showDetailStatus}
          setShowPopup={setShowDetailStatus}
          statusId={selectedStatusId}
        />
      )}
    </div>
  );
}
