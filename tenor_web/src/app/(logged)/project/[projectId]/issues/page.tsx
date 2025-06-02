"use client";

import IssuesTable from "~/app/(logged)/project/[projectId]/issues/IssuesTable";

export default function ProjectIssues() {
  return (
    <div className="m-6 flex-1 p-4">
      <IssuesTable />
    </div>
  );
}
