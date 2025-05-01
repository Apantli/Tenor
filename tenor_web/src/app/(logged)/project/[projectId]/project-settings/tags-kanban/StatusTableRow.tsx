"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import TagComponent from "~/app/_components/TagComponent";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";

interface StatusItem {
  id: string;
  name: string;
  color: string;
  markTaskAsDone: boolean;
  deleted: boolean;
  order: number;
}

interface StatusTableRowProps {
  item: StatusItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
}

export default function StatusTableRow({
  item,
  onEdit,
  onDelete,
  onToggleDone,
}: StatusTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative" as const,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-app-hover border-b border-app-border ${isDragging ? "bg-app-hover" : ""}`}
    >
      <td className="cursor-grab px-2" {...attributes} {...listeners}>
        <DragIndicatorIcon fontSize="small" className="text-gray-400" />
      </td>
      <td className="px-3 py-2">{item.order}</td>
      <td className="px-3 py-2">
        <button
          className="w-full truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
          onClick={onEdit}
        >
          {item.name}
        </button>
      </td>
      <td className="px-3 py-2">
        <TagComponent color={item.color} reducedPadding className="min-w-8">
          {item.color}
        </TagComponent>
      </td>
      <td className="px-3 py-2">
        <div className="flex h-full w-full items-center justify-center">
          <div
            className="flex items-center justify-center"
            style={{ margin: "0 auto" }}
          >
            <InputCheckbox
              checked={item.markTaskAsDone}
              onChange={onToggleDone}
              className="m-0 cursor-pointer"
            />
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="hover:bg-app-hover rounded p-1"
            title="Edit"
          >
            <EditIcon fontSize="small" className="text-gray-500" />
          </button>
          <button
            onClick={onDelete}
            className="hover:bg-app-hover rounded p-1"
            title="Delete"
          >
            <DeleteOutlineIcon fontSize="small" className="text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );
}
