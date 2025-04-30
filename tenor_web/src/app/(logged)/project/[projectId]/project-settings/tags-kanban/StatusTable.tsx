"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useState } from "react";
import { useAlert } from "~/app/_hooks/useAlert";
import { useEffect } from "react";
import SearchBar from "~/app/_components/SearchBar";
import CreateItemTagPopup from "./CreateItemTagPopup";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import ItemTagDetailPopup from "./ItemTagDetailPopup";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import TagComponent from "~/app/_components/TagComponent";
import useConfirmation from "~/app/_hooks/useConfirmation";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import HelpIcon from "@mui/icons-material/Help";
import CreateStatusPopup from "./CreateStatusPopup";
import StatusDetailPopup from "./StatusDetailPopup";
import { useInvalidateQueriesAllStatuses } from "~/app/_hooks/invalidateHooks";

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
      order: status.orderIndex,
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
  } as TableColumns<{
    id: string;
    name: string;
    color: string;
    markTaskAsDone: boolean;
    deleted: boolean;
    order: number;
  }>;

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

        <div className="max-w-[750px]">
          {isLoadingTags ? (
            <div className="py-4 text-center">Loading tags...</div>
          ) : (
            <Table
              className={`w-full ${
                tableData.length > 5 ? "max-h-[230px] overflow-auto" : ""
              }`}
              data={tableData}
              columns={columns}
              extraOptions={extraOptions}
              deletable={true}
              onDelete={(ids, callback) => {
                if (ids[0]) {
                  void handleDeleteStatus(ids[0]);
                }
                callback(true);
              }}
              multiselect={false}
              emptyMessage="No status found"
              tableKey="item-tag-table"
            />
          )}
        </div>
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
