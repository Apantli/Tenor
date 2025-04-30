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

export default function ItemTagTable() {
  const { projectId } = useParams();
  const utils = api.useUtils();
  const [searchValue, setSearchValue] = useState("");
  const [renderNewTag, showNewTag, setShowNewTag] = usePopupVisibilityState();
  const [renderDetailTag, showDetailTag, setShowDetailTag] =
    usePopupVisibilityState();
  const [selectedTagId, setSelectedTagId] = useState("");
  const confirm = useConfirmation();

  const {
    data: tags,
    isLoading: isLoadingTags,
    refetch: refetch,
  } = api.settings.getBacklogTags.useQuery({
    projectId: projectId as string,
  });

  const { mutateAsync: modifyTag } =
    api.settings.modifyBacklogTag.useMutation();
  const { mutateAsync: deleteTag } =
    api.settings.deleteBacklogTag.useMutation();

  const handleModifyTag = async function (tagId: string) {
    setSelectedTagId(tagId);
    setShowDetailTag(true);
  };

  const handleDeleteTag = async function (tagId: string) {
    if (
      await confirm(
        "Are you sure?",
        "This action will delete the tag.",
        "Delete",
        "Cancel",
      )
    ) {
      await utils.settings.getBacklogTags.cancel({
        projectId: projectId as string,
      });
      utils.settings.getBacklogTags.setData(
        { projectId: projectId as string },
        (oldData) => {
          if (!oldData) return [];
          return oldData.filter((tag) => tag.id !== tagId);
        },
      );

      await deleteTag({
        projectId: projectId as string,
        tagId: tagId,
      });
      await refetch();
    }
  };

  const filteredTags = tags?.filter((tag) => {
    if (
      (searchValue !== "" &&
        !tag.name.toLowerCase().includes(searchValue.toLowerCase())) ||
      tag.deleted
    ) {
      return false;
    }
    return true;
  });

  const tableData =
    filteredTags?.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      deleted: tag.deleted,
    })) ?? [];

  const columns = {
    id: { visible: false },
    name: {
      label: "Tag Name",
      width: 220,
      filterable: "search-only",
      sortable: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render(row) {
        return (
          <button
            className="w-full truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
            onClick={() => {
              setSelectedTagId(row.id);
              setShowDetailTag(true);
            }}
          >
            {row.name}
          </button>
        );
      },
    },
    color: {
      label: "Color",
      width: 120,
      render: (row) => (
        <TagComponent color={row.color} reducedPadding className="min-w-8">
          {row.color}
        </TagComponent>
      ),
    },
    deleted: { visible: false },
  } as TableColumns<{
    id: string;
    name: string;
    color: string;
    deleted: boolean;
  }>;

  const extraOptions = [
    {
      label: "Edit",
      icon: <MoreHorizIcon />,
      action: (ids: string[]) => {
        if (ids.length === 1 && ids[0]) {
          void handleModifyTag(ids[0]);
        }
      },
    },
  ];

  const onTagAdded = async () => {
    await utils.settings.getBacklogTags.invalidate({
      projectId: projectId as string,
    });
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex max-w-[750px] items-center justify-between gap-4">
          <div className="w-[700px]">
            <SearchBar
              placeholder="Find a tag..."
              searchValue={searchValue}
              handleUpdateSearch={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <PrimaryButton
            onClick={() => setShowNewTag(true)}
            className="whitespace-nowrap"
          >
            + Add tag
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
                  void handleDeleteTag(ids[0]);
                }
                callback(true);
              }}
              multiselect={false}
              emptyMessage="No tags found"
              tableKey="item-tag-table"
            />
          )}
        </div>
      </div>

      {renderNewTag && (
        <CreateItemTagPopup
          showPopup={showNewTag}
          onTagAdded={onTagAdded}
          setShowPopup={setShowNewTag}
        />
      )}

      {renderDetailTag && (
        <ItemTagDetailPopup
          showPopup={showDetailTag}
          setShowPopup={setShowDetailTag}
          tagId={selectedTagId}
        />
      )}
    </div>
  );
}
