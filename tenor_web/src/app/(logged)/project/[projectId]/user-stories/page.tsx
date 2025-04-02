"use client";

import PillComponent from "~/app/_components/PillComponent";
import PrimaryButton from "~/app/_components/PrimaryButton";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import type { Tag } from "~/lib/types/firebaseSchemas";
import { useState } from "react";

interface UserStoryCol {
  id: number;
  title: string;
  epicId: number;
  priority: Tag;
  size: Tag;
  sprintId: number;
  taskProgress: [number | undefined, number | undefined];
}

export default function ProjectUserStories() {
  const userStoryData: UserStoryCol[] = [
    {
      id: 1,
      title: "Implement user authentication",
      epicId: 1,
      priority: { name: "High", color: "#FF0000", deleted: false },
      size: { name: "M", color: "#00FF00", deleted: false },
      sprintId: 3,
      taskProgress: [2, 5],
    },
    {
      id: 2,
      title: "Redesign homepage UI",
      epicId: 1,
      priority: { name: "Medium", color: "#FFA500", deleted: false },
      size: { name: "L", color: "#0000FF", deleted: false },
      sprintId: 2,
      taskProgress: [1, 3],
    },
    {
      id: 3,
      title: "Optimize database queries",
      epicId: 2,
      priority: { name: "Critical", color: "#FF0000", deleted: false },
      size: { name: "S", color: "#008000", deleted: false },
      sprintId: 4,
      taskProgress: [3, 4],
    },
    {
      id: 4,
      title: "Add multi-language support",
      epicId: 3,
      priority: { name: "Low", color: "#808080", deleted: false },
      size: { name: "XL", color: "#800080", deleted: false },
      sprintId: 1,
      taskProgress: [0, 2],
    },
    {
      id: 5,
      title: "Develop API for mobile app",
      epicId: 2,
      priority: { name: "High", color: "#FF0000", deleted: false },
      size: { name: "M", color: "#00FF00", deleted: false },
      sprintId: 3,
      taskProgress: [4, 5],
    },
    {
      id: 6,
      title: "Fix payment gateway integration",
      epicId: 2,
      priority: { name: "Critical", color: "#FF0000", deleted: false },
      size: { name: "S", color: "#008000", deleted: false },
      sprintId: 5,
      taskProgress: [1, 1],
    },
    {
      id: 7,
      title: "Improve accessibility features",
      epicId: 3,
      priority: { name: "Medium", color: "#FFA500", deleted: false },
      size: { name: "M", color: "#00FF00", deleted: false },
      sprintId: 2,
      taskProgress: [2, 3],
    },
    {
      id: 8,
      title: "Integrate AI chatbot",
      epicId: 3,
      priority: { name: "High", color: "#FF0000", deleted: false },
      size: { name: "XXL", color: "#FF69B4", deleted: false },
      sprintId: 4,
      taskProgress: [0, 6],
    },
    {
      id: 9,
      title: "Migrate to new cloud provider",
      epicId: 1,
      priority: { name: "Medium", color: "#FFA500", deleted: false },
      size: { name: "L", color: "#0000FF", deleted: false },
      sprintId: 1,
      taskProgress: [1, 5],
    },
    {
      id: 10,
      title: "Implement dark mode",
      epicId: 2,
      priority: { name: "Low", color: "#808080", deleted: false },
      size: { name: "S", color: "#008000", deleted: false },
      sprintId: 3,
      taskProgress: [3, 4],
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">User Stories</h1>
      <span>Search bar</span>
      <PrimaryButton>Hello</PrimaryButton>

      <UserStoryTable userStoryData={userStoryData} />
    </div>
  );
}

interface UserStoryTableProps {
  userStoryData: UserStoryCol[];
}

function UserStoryTable({ userStoryData }: UserStoryTableProps) {
  const [data, setData] = useState(userStoryData);

  const priorityTags: Tag[] = Array.from(
    new Map(
      data.map((tag) => [
        tag.priority.name + tag.priority.color + tag.priority.deleted,
        tag.priority,
      ]),
    ).values(),
  );

  const sizeTags: Tag[] = Array.from(
    new Map(
      data.map((tag) => [
        tag.size.name + tag.size.color + tag.size.deleted,
        tag.size,
      ]),
    ).values(),
  );

  // TODO: Add correct leading 0 to ids (which depends on max id). Currently, 2 digits on all ids
  const tableColumns: TableColumns<UserStoryCol> = {
    id: {
      label: "Id",
      width: 80,
      filterable: "list",
      sortable: true,
      render(row) {
        return <span>US{row.id}</span>;
      },
    },
    title: {
      label: "Title",
      width: 400,
      filterable: "search-only",
      sortable: true,
    },
    epicId: {
      label: "Epic",
      width: 100,
      sortable: true,
      filterable: "search-only",
      render(row) {
        return <span>EP{row.epicId.toString().padStart(2, "0")}</span>;
      },
    },
    priority: {
      label: "Priority",
      width: 160,
      render(row) {
        return (
          <span className="w- flex">
            <PillComponent
              currentTag={row.priority}
              allTags={priorityTags}
              callBack={(tag: Tag) => {
                setData((prevData) =>
                  prevData.map((item) =>
                    item.id === row.id ? { ...item, priority: tag } : item,
                  ),
                );
              }}
              labelClassName="w-32"
            />
          </span>
        );
      },
    },
    size: {
      label: "Size",
      width: 100,
      render(row) {
        return (
          <span className="w- flex">
            <PillComponent
              currentTag={row.size}
              allTags={sizeTags}
              callBack={(tag: Tag) => {
                setData((prevData) =>
                  prevData.map((item) =>
                    item.id === row.id ? { ...item, size: tag } : item,
                  ),
                );
              }}
              labelClassName="w-20"
            />
          </span>
        );
      },
    },
    sprintId: {
      label: "Sprint",
      width: 100,
      sortable: true,
      filterable: "list",
      render(row) {
        return <span>EP{row.sprintId.toString().padStart(2, "0")}</span>;
      },
    },
    taskProgress: {
      label: "Task progress",
      width: 50,
      render(row) {
        return (
          <span className="flex justify-around">
            <span>{row.taskProgress[0] ?? 0}</span>
            <span>/</span>
            <span>{row.taskProgress[1] ?? "?"}</span>
          </span>
        );
      },
    },
  };

  // FIXME: Make table show in the remaining of the screen, without overflow in y axis (only scroll inside the table, not outside)
  return (
    <Table
      className="max-h-full"
      data={data}
      columns={tableColumns}
      multiselect
      deletable
      onDelete={(ids) => console.log("Deleted", ids)}
    />
  );
}
