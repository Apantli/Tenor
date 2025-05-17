"use client";

import { Handle, Position } from "@xyflow/react";
import { accentColorByCardType } from "~/utils/helpers/colorUtils";
import { cn } from "~/lib/utils";
import { useFormatAnyScrumId } from "~/app/_hooks/scrumIdHooks";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { useSelectedNode } from "~/app/_hooks/useSelectedNode";
import type { basicNodeData } from "~/lib/types/reactFlowTypes";

interface Props {
  // Encapsulating everything in a data property because it is needed by react flow
  data: basicNodeData;
  id?: string;
}

const handleSize = "8px";
const handleWhiteCircleStyle = {
  width: handleSize,
  height: handleSize,
  backgroundColor: "white",
  border: "1px solid #555",
  borderRadius: "50%",
};

// TODO: Add a prop to choose the handle style for each side
export default function BasicNode({
  data: {
    // id,
    scrumId,
    nodeType,
    title,
    showDeleteButton,
    // onDelete,
    showEditButton,
    // onEdit,
    // collapsible,
  },
  id,
}: Props) {
  const formatAnyScrumId = useFormatAnyScrumId();
  const { setSelectedId, setShowDetail } = useSelectedNode();

  const accentColor =
    accentColorByCardType[nodeType as keyof typeof accentColorByCardType];

  const handleClick = () => {
    if (id) {
      setSelectedId(id);
      setShowDetail(true);
    }
  };

  return (
    <>
      <Handle
        type="source"
        position={Position.Right}
        style={handleWhiteCircleStyle}
      />
      <div className="min-h-10 w-56 rounded-lg border border-slate-200 bg-white pb-3 pt-1 text-gray-800">
        <div className="flex flex-row items-center justify-between px-2 text-xs">
          <button
            className="flex grow-[1] underline-offset-4 hover:text-app-primary hover:underline"
            onClick={handleClick}
          >
            {formatAnyScrumId(scrumId, nodeType)}
          </button>
          {showEditButton && (
            <EditIcon
              fontSize="small"
              className="cursor-pointer hover:text-app-primary"
              onClick={handleClick}
            />
          )}
          {showDeleteButton && <DeleteOutlineIcon fontSize="small" />}
        </div>
        <hr className="mb-2 mt-1 border-t border-slate-400" />
        <div
          className="line-clamp-2 cursor-pointer truncate px-2 text-left text-xs underline-offset-4 hover:text-app-primary hover:underline"
          onClick={handleClick}
        >
          {title}
        </div>
        <div
          className={cn(
            "absolute bottom-0 left-0 h-2 w-full rounded-b-lg",
            accentColor,
          )}
        ></div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={handleWhiteCircleStyle}
      />
    </>
  );
}
