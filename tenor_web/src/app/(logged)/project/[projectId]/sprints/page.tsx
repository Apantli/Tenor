"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import SearchBar from "~/app/_components/SearchBar";
import { api } from "~/trpc/react";
import UserStoryDetailPopup from "../user-stories/UserStoryDetailPopup";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import UserStoryCardColumn from "~/app/_components/cards/UserStoryCardColumn";
import TertiaryButton from "~/app/_components/buttons/TertiaryButton";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import Dropdown, { DropdownButton } from "~/app/_components/Dropdown";

export default function ProjectSprints() {
  const { projectId } = useParams();

  const { data: userStoriesBySprint, isLoading } =
    api.sprints.getUserStoryPreviewsBySprint.useQuery({
      projectId: projectId as string,
    });
  const [selectedUserStories, setSelectedUserStories] = useState<Set<string>>(
    new Set(),
  );

  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  const [detailUserStoryId, setDetailUserStoryId] = useState("");

  // Check if all unassigned user stories are selected
  const allUnassignedSelected =
    userStoriesBySprint?.unassignedUserStories.every((userStory) =>
      selectedUserStories.has(userStory.id),
    );
  const someUnassignedSelected =
    userStoriesBySprint?.unassignedUserStories.some((userStory) =>
      selectedUserStories.has(userStory.id),
    );

  const selectAllUnassigned = () => {
    if (!userStoriesBySprint?.unassignedUserStories) return;
    const newSelection = new Set<string>();
    userStoriesBySprint.unassignedUserStories.forEach((userStory) => {
      newSelection.add(userStory.id);
    });
    setSelectedUserStories(newSelection);
  };

  const deselectAllUnassigned = () => {
    if (!userStoriesBySprint?.unassignedUserStories) return;
    const newSelection = new Set<string>();
    userStoriesBySprint.unassignedUserStories.forEach((userStory) => {
      newSelection.delete(userStory.id);
    });
    setSelectedUserStories(newSelection);
  };

  return (
    <>
      <div className="flex h-full overflow-hidden">
        <div className="flex h-full w-[420px] min-w-[420px] flex-col overflow-hidden border-r-2 pr-5">
          <div className="flex w-full justify-between pb-4">
            <h1 className="text-3xl font-semibold">Product Backlog</h1>
            <PrimaryButton onClick={() => {}}>+ Add Item</PrimaryButton>
          </div>

          <div className="flex w-full items-center gap-3 pb-4">
            <SearchBar
              searchValue={""}
              handleUpdateSearch={() => {}}
              placeholder="Search by title or tag..."
            ></SearchBar>
            {/* {allUnassignedSelected ? "Deselect all" : "Select all"} */}
          </div>

          <UserStoryCardColumn
            userStories={userStoriesBySprint?.unassignedUserStories ?? []}
            isLoading={isLoading}
            selection={selectedUserStories}
            setSelection={setSelectedUserStories}
            setDetailId={setDetailUserStoryId}
            setShowDetail={setShowDetail}
            header={
              <div className="flex justify-between pb-2 pr-1">
                <span>Unassigned items</span>
                <Dropdown label={"• • •"}>
                  {!allUnassignedSelected && (
                    <DropdownButton onClick={selectAllUnassigned}>
                      Select all
                    </DropdownButton>
                  )}
                  {someUnassignedSelected && (
                    <DropdownButton onClick={deselectAllUnassigned}>
                      Deselect all
                    </DropdownButton>
                  )}
                </Dropdown>
              </div>
            }
          />
        </div>
        <div className="ml-5 flex h-full grow">
          <div className="flex w-full justify-between gap-5 pb-4">
            <h1 className="text-3xl font-semibold">Sprints</h1>
            <PrimaryButton onClick={() => {}}>+ Add Sprint</PrimaryButton>
          </div>
        </div>
      </div>
      {renderDetail && (
        <UserStoryDetailPopup
          setShowDetail={setShowDetail}
          showDetail={showDetail}
          userStoryId={detailUserStoryId}
        />
      )}
    </>
  );
}
