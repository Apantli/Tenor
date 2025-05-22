"use client";

import { Handle, Position } from "@xyflow/react";
import { accentColorByCardType } from "~/utils/helpers/colorUtils";
import { cn } from "~/lib/utils";
import { useFormatAnyScrumId } from "~/app/_hooks/scrumIdHooks";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { VisualBasicNodeData } from "~/lib/types/reactFlowTypes";
import { useDeleteItemByType } from "~/app/_hooks/itemOperationHooks";
import { useParams } from "next/navigation";
import useConfirmation from "~/app/_hooks/useConfirmation";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";
import {
  permissionNumbers,
  type Permission,
} from "~/lib/types/firebaseSchemas";
import { checkPermissions, emptyRole } from "~/lib/defaultProjectValues";
import { useMemo } from "react";
import { api } from "~/trpc/react";

interface Props {
  // Encapsulating everything in a data property because it is needed by react flow
  data: VisualBasicNodeData;
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

export default function BasicNode({
  data: { scrumId, itemType, title, showDeleteButton, parentId },
  id,
}: Props) {
  // #region Hooks
  const { projectId } = useParams();
  const confirm = useConfirmation();
  const [, , , setDetailItemId] = useQueryIdForPopup("id");

  const formatAnyScrumId = useFormatAnyScrumId();
  const deleteItemByType = useDeleteItemByType();

  // #endregion

  // #region TRPC
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["backlog"],
      },
      role ?? emptyRole,
    );
  }, [role]);
  // #endregion

  // #region Handlers
  const handleDetailClick = () => {
    if (id) {
      setDetailItemId(id);
    }
  };

  const handleDeleteClick = async () => {
    if (!id) return;
    const confirmation = await confirm(
      "Are you sure you want to delete " +
        formatAnyScrumId(scrumId, itemType) +
        "?",
      "This action cannot be undone.",
      "Delete",
      "Cancel",
    );
    if (!confirmation) {
      return;
    }
    // Invalidation is made inside the deleteItemByType function
    await deleteItemByType(projectId as string, itemType, id, parentId);
  };
  // #endregion

  // #region General
  const accentColor =
    accentColorByCardType[itemType as keyof typeof accentColorByCardType];
  // #endregion

  return (
    <>
      {permission >= permissionNumbers.write && (
        <Handle
          type="source"
          position={Position.Right}
          style={handleWhiteCircleStyle}
        />
      )}
      <div className="min-h-10 w-56 rounded-lg border border-slate-200 bg-white pb-3 pt-1 text-gray-800">
        <div className="flex flex-row items-center justify-between px-2 text-xs">
          <button
            className="flex grow-[1] underline-offset-4 hover:text-app-primary hover:underline"
            onClick={handleDetailClick}
          >
            {formatAnyScrumId(scrumId, itemType)}
          </button>
          {showDeleteButton && permission >= permissionNumbers.write && (
            <DeleteOutlineIcon
              fontSize="small"
              className="cursor-pointer hover:text-app-primary"
              onClick={handleDeleteClick}
            />
          )}
        </div>
        <hr className="mb-2 mt-1 border-t border-slate-400" />
        {/* Padding bottom of 1 ridiculous pixel is due to a visual bug that causes the underline to disappear without it */}
        <div
          className="line-clamp-2 cursor-pointer truncate px-2 pb-[1px] text-left text-xs underline-offset-4 hover:text-app-primary hover:underline"
          onClick={handleDetailClick}
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
      {permission >= permissionNumbers.write && (
        <Handle
          type="target"
          position={Position.Left}
          style={handleWhiteCircleStyle}
        />
      )}
    </>
  );
}
