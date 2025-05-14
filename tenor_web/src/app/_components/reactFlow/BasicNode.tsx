"use client";

import { Handle, Position } from "@xyflow/react";
import { accentColorByCardType } from "~/utils/helpers/colorUtils";
import type { KanbanCard } from "~/lib/types/kanbanTypes";
import { cn } from "~/lib/utils";
import { useFormatAnyScrumId } from "~/app/_hooks/scrumIdHooks";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";

interface Props {
  // Encapsulating everything in a data property because it is needed by react flow
  data: {
    id: string;
    scrumId: number;
    nodeType: KanbanCard["cardType"];
    title: string;
    content: string;
    showDeleteButton: boolean;
    onDelete: () => void;
    showEditButton: boolean;
    onEdit: () => void;
    collapsible: boolean;
  };
}

const handleSize = "8px";

export default function BasicNode({
  data: {
    id,
    scrumId,
    nodeType,
    title,
    content,
    showDeleteButton,
    onDelete,
    showEditButton,
    onEdit,
    collapsible,
  },
}: Props) {
  const formatAnyScrumId = useFormatAnyScrumId();

  const accentColor =
    accentColorByCardType[nodeType as keyof typeof accentColorByCardType];

  return (
    <>
      <Handle
        type="source"
        position={Position.Right}
        id="L"
        style={{ width: handleSize, height: handleSize }}
      />
      <div className="min-h-10 w-56 rounded-lg border border-slate-200 bg-white pb-3 pt-1 text-gray-800">
        {/* TODO: Fix this to work for epic node design (see figma) */}
        <div className="flex flex-row items-center justify-between px-2 text-sm">
          <span className="flex grow-[1]">
            {formatAnyScrumId(scrumId, nodeType)}
          </span>
          <EditIcon fontSize="small" />
          <DeleteOutlineIcon fontSize="small" />
        </div>
        <hr className="mb-2 mt-1 border-t border-slate-400" />
        <div className="line-clamp-2 px-2 text-lg">{title}</div>
        <div
          className={cn(
            "absolute bottom-0 left-0 h-2 w-full rounded-b-lg",
            accentColor,
          )}
        ></div>
      </div>
      {/* TODO: Add custom styling */}
      <Handle
        type="target"
        position={Position.Left}
        id="R"
        style={{ width: handleSize, height: handleSize }}
      />
    </>
  );
}
