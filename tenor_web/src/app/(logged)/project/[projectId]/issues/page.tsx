"use client";

import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import CreateIssuePopup from "./CreateIssuePopup";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import IssuesTable from "~/app/_components/sections/IssuesTable";
import IssueDetailPopup from "./IssueDetailPopup";

export default function ProjectIssues() {

  return (
    <div>
      <div>
        <IssuesTable />
      </div>
    </div>
  );
}
