import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TagComponent from "~/app/_components/TagComponent";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import Dropdown, { DropdownButton } from "~/app/_components/Dropdown";

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
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export default function StatusTableRow({
  item,
  onEdit,
  onDelete,
  onToggleDone,
  scrollContainerRef,
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
    position: "relative" as const,
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
        <Dropdown
          label={
            <span className="flex w-full items-center justify-end pr-3 font-bold text-app-light">
              • • •
            </span>
          }
          className="flex h-full w-full items-center justify-end text-sm font-semibold transition"
          menuClassName="font-normal whitespace-nowrap z-50"
          scrollContainer={scrollContainerRef}
        >
          <DropdownButton
            className="flex items-center justify-between gap-8"
            onClick={onEdit}
          >
            <span>Edit</span>
            <EditIcon fontSize="small" />
          </DropdownButton>
          <DropdownButton
            className="flex items-center justify-between gap-8"
            onClick={onDelete}
          >
            <span className="text-red-500">Delete</span>
            <DeleteOutlineIcon className="text-red-500" />
          </DropdownButton>
        </Dropdown>
      </td>
    </tr>
  );
}
