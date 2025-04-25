"use client";

import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import CreateIssuePopup from "./CreateIssuePopup";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import IssuesTable from "~/app/_components/sections/IssuesTable";
import IssueDetailPopup from "./IssueDetailPopup";

export default function ProjectIssues() {
  const [renderNewStory, showNewStory, setShowNewStory] =
    usePopupVisibilityState();
  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();

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

      <PrimaryButton onClick={() => setShowDetail(true)}>
        Edit Issue
      </PrimaryButton>

      {/* FIXME Testing issue inside http://tenor.dev/project/PxeyrC2a7Ymix2Y7pzFx/issues */}
      {/* TODO Delete once table is created */}
      {renderDetail && (
        <IssueDetailPopup
          showDetail={showDetail}
          setShowDetail={setShowDetail}
          issueId={"o9oghXMHVueESQNv9jnN"}
        />
      )}

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
