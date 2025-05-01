"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useState } from "react";
import SearchBar from "~/app/_components/SearchBar";
import CreateItemTagPopup from "./CreateItemTagPopup";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import ItemTagDetailPopup from "./ItemTagDetailPopup";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import TagComponent from "~/app/_components/TagComponent";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useInvalidateQueriesAllTags } from "~/app/_hooks/invalidateHooks";

interface TagTableConfig {
  title: string;
  addButtonText: string;
  searchPlaceholder: string;
  emptyMessage: string;
}

type TagType = "ReqFocus" | "BacklogTag" | "ReqType";

interface Props {
  itemTagType: TagType;
}

export default function ItemTagTable({ itemTagType }: Props) {
  const { projectId } = useParams();
  const utils = api.useUtils();
  const [searchValue, setSearchValue] = useState("");
  const [renderNewTag, showNewTag, setShowNewTag] = usePopupVisibilityState();
  const [renderDetailTag, showDetailTag, setShowDetailTag] =
    usePopupVisibilityState();
  const [selectedTagId, setSelectedTagId] = useState("");
  const confirm = useConfirmation();
  const invalidateQueriesAllTags = useInvalidateQueriesAllTags();

  const tagTypeConfigs: Record<TagType, TagTableConfig> = {
    BacklogTag: {
      title: "Backlog Tags",
      addButtonText: "+ Add tag",
      searchPlaceholder: "Find a tag...",
      emptyMessage: "No tags found",
    },
    ReqFocus: {
      title: "Requirement Focus Areas",
      addButtonText: "+ Add focus",
      searchPlaceholder: "Find a focus area...",
      emptyMessage: "No focus areas found",
    },
    ReqType: {
      title: "Requirement Types",
      addButtonText: "+ Add type",
      searchPlaceholder: "Find a type...",
      emptyMessage: "No requirement types found",
    },
  };

  const currentConfig = tagTypeConfigs[itemTagType];

  let tagsQueryResult;

  switch (itemTagType) {
    case "BacklogTag":
      tagsQueryResult = api.settings.getBacklogTags.useQuery({
        projectId: projectId as string,
      });
      break;
    case "ReqFocus":
      tagsQueryResult = api.requirements.getRequirementFocusTags.useQuery({
        projectId: projectId as string,
      });
      break;
    case "ReqType":
      tagsQueryResult = api.requirements.getRequirementTypeTags.useQuery({
        projectId: projectId as string,
      });
      break;
  }

  const {
    data: tags,
    isLoading: isLoadingTags,
    refetch,
  } = tagsQueryResult || {};

  let deleteTagMutation;

  switch (itemTagType) {
    case "BacklogTag":
      deleteTagMutation = api.settings.deleteBacklogTag.useMutation();
      break;
    case "ReqFocus":
      deleteTagMutation =
        api.requirements.deleteRequirementFocusTag.useMutation();
      break;
    case "ReqType":
      deleteTagMutation =
        api.requirements.deleteRequirementTypeTag.useMutation();
      break;
  }

  const { mutateAsync: deleteTag } = deleteTagMutation || {};

  const handleModifyTag = async function (tagId: string) {
    setSelectedTagId(tagId);
    setShowDetailTag(true);
  };

  const handleDeleteTag = async function (
    tagIds: string[],
    callback: (del: boolean) => void,
  ) {
    const isMultiple = tagIds.length > 1;
    const entityName = isMultiple
      ? itemTagType === "BacklogTag"
        ? "tags"
        : itemTagType === "ReqFocus"
          ? "requirement focus areas"
          : "requirement types"
      : itemTagType === "BacklogTag"
        ? "tag"
        : itemTagType === "ReqFocus"
          ? "requirement focus area"
          : "requirement type";

    const confirmTitle = "Are you sure?";
    const confirmMessage = `This action will delete ${isMultiple ? "these " + tagIds.length + " " + entityName : "the " + entityName}.`;

    if (await confirm(confirmTitle, confirmMessage, "Delete", "Cancel")) {
      switch (itemTagType) {
        case "BacklogTag":
          await utils.settings.getBacklogTags.cancel({
            projectId: projectId as string,
          });
          utils.settings.getBacklogTags.setData(
            { projectId: projectId as string },
            (oldData) => {
              if (!oldData) return [];
              return oldData.filter((tag) => !tagIds.includes(tag.id));
            },
          );
          break;
        case "ReqFocus":
          await utils.requirements.getRequirementFocusTags.cancel({
            projectId: projectId as string,
          });
          utils.requirements.getRequirementFocusTags.setData(
            { projectId: projectId as string },
            (oldData) => {
              if (!oldData) return [];
              return oldData.filter((tag) => !tagIds.includes(tag.id!));
            },
          );
          break;
        case "ReqType":
          await utils.requirements.getRequirementTypeTags.cancel({
            projectId: projectId as string,
          });
          utils.requirements.getRequirementTypeTags.setData(
            { projectId: projectId as string },
            (oldData) => {
              if (!oldData) return [];
              return oldData.filter((tag) => !tagIds.includes(tag.id!));
            },
          );
          break;
      }

      await Promise.all(
        tagIds.map((tagId) =>
          deleteTag({
            projectId: projectId as string,
            tagId: tagId,
          }),
        ),
      );

      callback(true);
      await refetch();
      return true;
    }

    callback(false);
    return false;
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
      id: tag.id!,
      name: tag.name,
      color: tag.color,
      deleted: tag.deleted ?? false,
    })) ?? [];

  let nameColumnLabel: string;
  switch (itemTagType) {
    case "BacklogTag":
      nameColumnLabel = "Tag Name";
      break;
    case "ReqFocus":
      nameColumnLabel = "Focus Area";
      break;
    case "ReqType":
      nameColumnLabel = "Requirement Type";
      break;
  }

  const columns = {
    id: { visible: false },
    name: {
      label: nameColumnLabel,
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
    await invalidateQueriesAllTags(projectId as string);
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex max-w-[750px] items-center justify-between gap-4">
          <div className="w-[700px]">
            <SearchBar
              placeholder={currentConfig.searchPlaceholder}
              searchValue={searchValue}
              handleUpdateSearch={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <PrimaryButton
            onClick={() => setShowNewTag(true)}
            className="whitespace-nowrap"
          >
            {currentConfig.addButtonText}
          </PrimaryButton>
        </div>

        <div className="max-w-[750px]">
          {isLoadingTags ? (
            <div className="py-4 text-center">Loading...</div>
          ) : (
            <Table
              className={`w-full ${
                tableData.length > 5 ? "max-h-[280px] overflow-auto" : ""
              }`}
              data={tableData}
              columns={columns}
              extraOptions={extraOptions}
              deletable={true}
              onDelete={(ids, callback) => {
                if (ids.length > 0) {
                  void handleDeleteTag(ids, callback);
                } else {
                  callback(false);
                }
              }}
              multiselect={true}
              emptyMessage={currentConfig.emptyMessage}
              tableKey={`${itemTagType.toLowerCase()}-table`}
            />
          )}
        </div>
      </div>

      {renderNewTag && (
        <CreateItemTagPopup
          showPopup={showNewTag}
          onTagAdded={onTagAdded}
          setShowPopup={setShowNewTag}
          itemTagType={itemTagType}
        />
      )}

      {renderDetailTag && (
        <ItemTagDetailPopup
          showPopup={showDetailTag}
          setShowPopup={setShowDetailTag}
          tagId={selectedTagId}
          itemTagType={itemTagType}
        />
      )}
    </div>
  );
}
