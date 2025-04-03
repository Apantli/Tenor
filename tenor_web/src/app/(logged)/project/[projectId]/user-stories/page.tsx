"use client";

import PillComponent from "~/app/_components/PillComponent";
import PrimaryButton from "~/app/_components/PrimaryButton";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import type { Tag, UserStory, WithId } from "~/lib/types/firebaseSchemas";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";

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
  const params = useParams();

  const createUS = api.projects.createUserStory.useMutation();
  const { data: userStories, isLoading } =
    api.projects.getUSFromProject.useQuery(params.projectId as string);
  console.log("my result is", userStories);

  const [userStoryData, setUserStoryData] = useState<UserStoryCol[]>();

  // FIXME: Make it update the table to include new US
  const handleCreateUS = () => {
    createUS.mutate(params.projectId as string);
  };

  const createTableData = (data: typeof userStories) => {
    if (!data) return [];

    const defaultPriority: Tag = {
      name: "Medium",
      color: "#FFD700",
      deleted: false,
    };
    const defaultSize: Tag = { name: "M", color: "#00BFFF", deleted: false };

    return data.map((userStory) => ({
      id: userStory.scrumId,
      title: userStory.name,
      epicId: Math.floor(Math.random() * 10),
      priority: defaultPriority,
      size: defaultSize,
      sprintId: Math.floor(Math.random() * 10),
      taskProgress: [0, userStory.tasks.length] as [
        number | undefined,
        number | undefined,
      ],
    }));
  };

  useEffect(() => {
    if (userStories) {
      setUserStoryData(createTableData(userStories));
    }
  }, [userStories]);

  const getTable = () => {
    if (userStories == undefined || isLoading) {
      return <span>Loading...</span>;
    }

    if (userStoryData == undefined || userStoryData?.length == 0) {
      return <span>No User stories found</span>;
    }

    return <UserStoryTable userStoryData={userStoryData} />;
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <h1 className="text-2xl font-semibold">User Stories</h1>

      <div className="flex items-center gap-2">
        <span>Search bar</span>
        <PrimaryButton onClick={handleCreateUS}>+ New Story</PrimaryButton>
      </div>

      {getTable()}
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
