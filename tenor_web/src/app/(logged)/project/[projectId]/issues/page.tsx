"use client";

import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import CreateIssuePopup from "./CreateIssuePopup";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import IssuesTable from "~/app/_components/sections/IssuesTable";

export default function ProjectIssues() {
  const [renderNewStory, showNewStory, setShowNewStory] =
    usePopupVisibilityState();

  const onIssueAdded = async (userStoryId: string) => {
    // await refetchUS();
    setShowNewStory(false);
    // setSelectedUS(userStoryId);
    // setShowDetail(true);
  };

  return (
    <div>
      <PrimaryButton onClick={() => setShowNewStory(true)}>
        + New Story
      </PrimaryButton>
      {renderNewStory && (
        <CreateIssuePopup
          onIssueAdded={onIssueAdded}
          showPopup={showNewStory}
          setShowPopup={setShowNewStory}
        />
      )}
      <div>
        <IssuesTable />
      </div>
    </div>
  );
}
