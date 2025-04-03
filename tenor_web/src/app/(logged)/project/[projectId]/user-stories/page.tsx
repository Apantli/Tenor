"use client";

import PillComponent from "~/app/_components/PillComponent";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import type { Tag, WithId, UserStory } from "~/lib/types/firebaseSchemas";
import { useEffect, useState, type ChangeEventHandler } from "react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import SearchBar from "~/app/_components/SearchBar";

interface UserStoryCol {
  id: number;
  title: string;
  epicId: number;
  priority: Tag;
  size: Tag;
  sprintId: number;
  taskProgress: [number | undefined, number | undefined];
}

const createTableData = (data: WithId<UserStory>[] | undefined) => {
  if (!data) return [];

  const defaultPriority: Tag = {
    name: "Other",
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

export default function ProjectUserStories() {
  // Hooks
  const params = useParams();
  const [userStoryData, setUserStoryData] = useState<UserStoryCol[]>([]);
  const [searchValue, setSearchValue] = useState("");

  // TRPC
  const { mutateAsync: createUS } = api.projects.createUserStory.useMutation();
  const {
    data: userStories,
    isLoading: isLoadingUS,
    refetch: refetchUS,
  } = api.projects.getUSFromProject.useQuery(params.projectId as string);

  // Handles
  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
    const searchValue = e.target.value.toLowerCase();
    const filteredData = userStories?.filter(
      (userStory) =>
        userStory.name.toLowerCase().includes(searchValue) ||
        ("us" + userStory.scrumId.toString().padStart(3, "0")).includes(searchValue),
    );
    setUserStoryData(
      createTableData(filteredData).sort((a, b) => (a.id < b.id ? -1 : 1)),
    );
  };

  const handleCreateUS = async () => {
    await createUS(params.projectId as string);
    await refetchUS();
  };

  useEffect(() => {
    if (userStories) {
      // default sort by id. This is overriden by the table sorting feature
      setUserStoryData(
        createTableData(userStories).sort((a, b) => (a.id < b.id ? -1 : 1)),
      );
    }
  }, [userStories]);

  // Function to get the US table or message instead
  const getTable = () => {
    if (userStories == undefined || isLoadingUS) {
      return <span>Loading...</span>;
    }

    if (userStoryData?.length == 0) {
      return <span>No User stories found</span>;
    }

    const priorityTags: Tag[] = Array.from(
      new Map(
        userStoryData.map((tag) => [
          tag.priority.name + tag.priority.color + tag.priority.deleted,
          tag.priority,
        ]),
      ).values(),
    );

    const sizeTags: Tag[] = Array.from(
      new Map(
        userStoryData.map((tag) => [
          tag.size.name + tag.size.color + tag.size.deleted,
          tag.size,
        ]),
      ).values(),
    );

    // TODO: Add correct leading 0 to ids (which depends on max id). Currently, 3 digits on all ids
    const tableColumns: TableColumns<UserStoryCol> = {
      id: {
        label: "Id",
        width: 80,
        sortable: true,
        render(row) {
          return <span>US{row.id.toString().padStart(3, "0")}</span>;
        },
      },
      title: {
        label: "Title",
        width: 400,
        sortable: true,
      },
      epicId: {
        label: "Epic",
        width: 100,
        sortable: true,
        filterable: "search-only",
        render(row) {
          return <span>EP{row.epicId.toString().padStart(3, "0")}</span>;
        },
      },
      priority: {
        label: "Priority",
        width: 160,
        render(row) {
          return (
            <span className="flex justify-start">
              <PillComponent
                currentTag={row.priority}
                allTags={priorityTags}
                callBack={(tag: Tag) => {
                  setUserStoryData((prevData) =>
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
            <span className="flex justify-start">
              <PillComponent
                currentTag={row.size}
                allTags={sizeTags}
                callBack={(tag: Tag) => {
                  setUserStoryData((prevData) =>
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
          return (
            <span>
              {row.sprintId == 0 ? "No Sprint" : "Sprint " + row.sprintId}
            </span>
          );
        },
      },
      taskProgress: {
        label: "Task progress",
        width: 60,
        render(row) {
          return (
            <span className="flex justify-start gap-1">
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
        className="max-h-full w-full"
        data={userStoryData}
        columns={tableColumns}
        multiselect
        deletable
        onDelete={(ids) => console.log("Deleted", ids)}
      />
    );
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-3xl font-semibold">User Stories</h1>

      <div className="flex w-full items-center gap-3 pb-2">
        <SearchBar
          searchValue={searchValue}
          handleUpdateSearch={handleUpdateSearch}
          placeholder="Find a user story by title or Id..."
        ></SearchBar>
        <PrimaryButton onClick={handleCreateUS}>+ New Story</PrimaryButton>
      </div>

      {getTable()}
    </div>
  );
}
