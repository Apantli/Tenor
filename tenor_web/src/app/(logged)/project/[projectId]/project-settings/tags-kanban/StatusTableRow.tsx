"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TagComponent from "~/app/_components/TagComponent";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import { useState, useRef, useEffect } from "react";

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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
    setShowDropdown(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowDropdown(false);
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-app-hover border-b border-app-border ${
        isDragging ? "bg-app-hover" : ""
      }`}
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
      <td className="px-3 py-2 text-right">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="inline-flex items-center text-app-light"
          >
            <span className="font-bold">• • •</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-32 rounded border border-app-border bg-white py-1 shadow-md">
              <button
                type="button"
                onClick={handleEditClick}
                className="hover:bg-app-hover flex w-full items-center justify-between px-4 py-2 text-left"
              >
                <span>Edit</span>
                <EditIcon fontSize="small" />
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="hover:bg-app-hover flex w-full items-center justify-between px-4 py-2 text-left text-red-500"
              >
                <span>Delete</span>
                <DeleteOutlineIcon fontSize="small" className="text-red-500" />
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
