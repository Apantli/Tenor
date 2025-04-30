"use client";

import React from "react";
import HelpIcon from "@mui/icons-material/Help";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";

interface Props {
  itemId: string;
}

export default function StatusTooltip({ itemId }: Props) {
  const { projectId } = useParams();
  const { data: automaticStatus } = api.kanban.getItemAutomaticStatus.useQuery({
    projectId: projectId as string,
    itemId: itemId,
  });

  const isUndefined = () => {
    if (automaticStatus === undefined) {
      return true;
    } else {
      return false;
    }
  };
  const tooltipHtml = `<div style='display: flex; flex-direction: column; gap: 2px; align-items: center'><p>An item with an automatic status is intelligently assigned to a status based on the progress of all its tasks.</p><p style='margin-left: auto; margin-right: auto'>Currently, the status of this item is: <strong>${automaticStatus?.name}</strong></p></div>`;

  return isUndefined() ? null : (
    <HelpIcon
      className="ml-[3px] text-gray-500"
      data-tooltip-id="tooltip"
      data-tooltip-html={tooltipHtml}
      data-tooltip-place="top-start"
      style={{ width: "15px" }}
    />
  );
}
