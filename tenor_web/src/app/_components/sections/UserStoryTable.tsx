"use client";

import Table, { type TableColumns } from "~/app/_components/table/Table";
import {
  type Permission,
  permissionNumbers,
  type Size,
  type Tag,
} from "~/lib/types/firebaseSchemas";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
} from "react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import SearchBar from "~/app/_components/SearchBar";
import { cn } from "~/lib/utils";
import { usePopupVisibilityState } from "../Popup";
import UserStoryDetailPopup from "~/app/(logged)/project/[projectId]/user-stories/UserStoryDetailPopup";
import { SizePillComponent } from "../specific-pickers/SizePillComponent";
import CreateUserStoryPopup from "~/app/(logged)/project/[projectId]/user-stories/CreateUserStoryPopup";
import {
  useFormatEpicScrumId,
  useFormatSprintNumber,
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import useConfirmation from "~/app/_hooks/useConfirmation";
import LoadingSpinner from "../LoadingSpinner";
import AiGeneratorDropdown from "../ai/AiGeneratorDropdown";
import useGhostTableStateManager from "~/app/_hooks/useGhostTableStateManager";

import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import {
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesAllUserStories,
  useInvalidateQueriesUserStoriesDetails,
} from "~/app/_hooks/invalidateHooks";
import type { UserStoryDetailWithTasks } from "~/lib/types/detailSchemas";
import { Timestamp } from "firebase/firestore";
import type { UserStoryCol } from "~/lib/types/columnTypes";
import { checkPermissions, emptyRole } from "~/lib/defaultProjectValues";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";

export const heightOfContent = "h-[calc(100vh-285px)]";

interface Props {
  setAllowSegmentedControlChange: (value: boolean) => void;
}

export default function UserStoryTable({
  setAllowSegmentedControlChange,
}: Props) {
  // #region Hooks
  const { projectId } = useParams();
  const [searchValue, setSearchValue] = useState("");

  const [selectedGhostUS, setSelectedGhostUS] = useState("");
  const [renderNewStory, showNewStory, setShowNewStory] =
    usePopupVisibilityState();
  const [renderDetail, showDetail, selectedUS, setUserStoryId, setShowDetail] =
    useQueryIdForPopup("id");

  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const formatEpicScrumId = useFormatEpicScrumId();
  const formatSprintNumber = useFormatSprintNumber();
  const confirm = useConfirmation();

  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

  // For the ghost US
  const generatedUserStories = useRef<UserStoryDetailWithTasks[]>();
  const {
    onAccept,
    onAcceptAll,
    onReject,
    onRejectAll,
    beginLoading,
    finishLoading,
    ghostData,
    ghostRows,
    setGhostRows,
    generating,
    updateGhostRow,
  } = useGhostTableStateManager<UserStoryCol, string>(
    async (acceptedIds) => {
      const accepted =
        generatedUserStories.current?.filter((story) =>
          acceptedIds.includes(story.id),
        ) ?? [];
      const acceptedRows = ghostData?.filter((ghost) =>
        acceptedIds.includes(ghost.id),
      );
      // Use optimistic update to update the user stories table
      await utils.userStories.getUserStoryTable.cancel({
        projectId: projectId as string,
      });
      utils.userStories.getUserStoryTable.setData(
        { projectId: projectId as string },
        userStoryData.concat(acceptedRows ?? []),
      );

      // Add the user stories to the database
      for (const userStory of accepted.reverse()) {
        // TODO: Verify for circular dependencies in ghosts
        const { id: userStoryId } = await createUserStory({
          projectId: projectId as string,
          userStoryData: {
            name: userStory.name,
            description: userStory.description,
            sprintId: "",
            taskIds: [],
            complete: false,
            tagIds: userStory.tags
              .map((tag) => tag.id)
              .filter((id) => id !== undefined),
            size: userStory.size,
            priorityId: userStory.priority?.id ?? "",
            epicId: userStory.epic?.id ?? "",
            acceptanceCriteria: userStory.acceptanceCriteria,
            dependencyIds: userStory.dependencies.map((dep) => dep.id),
            requiredByIds: userStory.requiredBy.map((dep) => dep.id),
          },
        });

        if (userStory.tasks.length > 0) {
          for (const task of userStory.tasks) {
            await createTask({
              projectId: projectId as string,
              taskData: {
                name: task.name,
                description: task.description,
                itemId: userStoryId,
                assigneeId: task.assignee?.id ?? "",
                dueDate: task.dueDate
                  ? Timestamp.fromDate(task.dueDate)
                  : undefined,
                itemType: "US",
                statusId: task.status?.id ?? "",
                deleted: false,
                size: task.size,
              },
            });
          }
        }
      }

      await invalidateQueriesAllUserStories(projectId as string);
    },
    (removedIds) => {
      const newGeneratedUserStories = generatedUserStories.current?.filter(
        (story) => !removedIds.includes(story.id),
      );
      generatedUserStories.current = newGeneratedUserStories;
    },
  );

  useNavigationGuard(
    async () => {
      if ((generatedUserStories?.current?.length ?? 0) > 0) {
        return !(await confirm(
          "Are you sure?",
          "You have unsaved AI generated user stories. To save them, please accept them first.",
          "Discard",
          "Keep editing",
        ));
      } else if (generating) {
        return !(await confirm(
          "Are you sure?",
          "You are currently generating user stories. If you leave now, the generation will be cancelled.",
          "Discard",
          "Keep editing",
        ));
      }
      return false;
    },
    generating || (generatedUserStories.current?.length ?? 0) > 0,
    "Are you sure you want to leave? You have unsaved AI generated user stories. To save them, please accept them first.",
  );
  // #endregion

  // #region TRPC
  const utils = api.useUtils();
  const { data: userStories, isLoading: isLoadingUS } =
    api.userStories.getUserStoryTable.useQuery({
      projectId: projectId as string,
    });
  const { mutateAsync: updateUserStoryTags } =
    api.userStories.modifyUserStoryTags.useMutation();
  const { mutateAsync: deleteUserStory } =
    api.userStories.deleteUserStory.useMutation();
  const { mutateAsync: createUserStory } =
    api.userStories.createUserStory.useMutation();
  const { mutateAsync: createTask } = api.tasks.createTask.useMutation();
  const { mutateAsync: generateStories } =
    api.userStories.generateUserStories.useMutation();

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

  // #region Handles
  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
  };

  const handleDelete = async (
    ids: string[],
    callback: (del: boolean) => void,
  ) => {
    const confirmMessage = ids.length > 1 ? "user stories" : "user story";
    if (
      !(await confirm(
        `Are you sure you want to delete ${ids.length == 1 ? "this " + confirmMessage : ids.length + " " + confirmMessage}?`,
        "This action is not reversible.",
        `Delete ${confirmMessage}`,
      ))
    ) {
      callback(false);
      return;
    }
    callback(true); // call the callback as soon as possible

    const newData = userStoryData.filter(
      (userStory) => !ids.includes(userStory.id),
    );

    // Uses optimistic update to update the size of the user story
    await utils.userStories.getUserStoryTable.cancel({
      projectId: projectId as string,
    });
    utils.userStories.getUserStoryTable.setData(
      { projectId: projectId as string },
      newData,
    );

    // Deletes in database
    await Promise.all(
      ids.map((id) =>
        deleteUserStory({
          projectId: projectId as string,
          userStoryId: id,
        }),
      ),
    );
    await invalidateQueriesAllTasks(projectId as string);
    await invalidateQueriesAllUserStories(projectId as string);
    return true;
  };

  const filteredData = (userStories ?? []).filter((userStory) => {
    const lowerSearchValue = searchValue.toLowerCase();
    return (
      userStory.name.toLowerCase().includes(lowerSearchValue) ||
      formatUserStoryScrumId(userStory.scrumId!).includes(lowerSearchValue)
    );
  });

  const userStoryData = filteredData.sort((a, b) => {
    // Flipped to show the latest user stories first (also makes AI generated ones appear at the top after getting accepted)
    if (
      (a.scrumId === undefined || a.scrumId === -1) &&
      (b.scrumId === undefined || b.scrumId === -1)
    )
      return 0;
    if (a.scrumId === undefined || a.scrumId === -1) return -1;
    if (b.scrumId === undefined || b.scrumId === -1) return 1;

    return a.scrumId < b.scrumId ? 1 : -1;
  });

  const onUserStoryAdded = async (userStoryId: string) => {
    await invalidateQueriesAllUserStories(projectId as string);
    setShowNewStory(false);
    setSelectedGhostUS("");
    setUserStoryId(userStoryId);
  };

  const generateUserStories = async (amount: number, prompt: string) => {
    beginLoading(amount);

    const generatedData = await generateStories({
      amount,
      prompt,
      projectId: projectId as string,
    });
    generatedUserStories.current = generatedData.map((story, i) => ({
      ...story,
      id: i.toString(),
      tasks: [],
    }));

    const tableData = generatedData.map((data, i) => ({
      id: i.toString(),
      scrumId: -1,
      name: data.name,
      epicScrumId: data.epic?.scrumId,
      priority: data.priority,
      size: data.size ?? "M",
      sprintNumber: undefined,
      taskProgress: [0, 0] as [number, number],
    }));

    // TODO: Re-add this
    finishLoading(tableData);
  };

  // #endregion

  // #region Utils
  // Function to get the US table or message instead
  const getTable = () => {
    if (userStories == undefined || isLoadingUS) {
      return (
        <div className="flex h-full w-full flex-1 items-start justify-center p-10">
          <LoadingSpinner color="primary" />
        </div>
      );
    }

    // TODO: Add correct leading 0 to ids (which depends on max id). Currently hardcoded
    const tableColumns: TableColumns<UserStoryCol> = {
      id: { visible: false },
      scrumId: {
        label: "Id",
        width: 80,
        sortable: true,
        render(row) {
          return (
            <button
              className="flex w-full items-center truncate text-left text-app-text underline-offset-4 hover:text-app-primary hover:underline disabled:opacity-70 disabled:hover:text-app-text disabled:hover:no-underline"
              onClick={() => {
                setSelectedGhostUS("");
                if (row.scrumId !== -1) {
                  setUserStoryId(row.id);
                }
              }}
              disabled={row.scrumId === -1}
            >
              {row.scrumId !== -1 ? (
                formatUserStoryScrumId(row.scrumId ?? -1)
              ) : (
                <div className="h-6 w-[calc(100%-40px)] animate-pulse rounded-md bg-slate-500/50"></div>
              )}
            </button>
          );
        },
        hiddenOnGhost: true,
      },
      name: {
        label: "Title",
        width: 220,
        sortable: true,
        render(row, _, isGhost) {
          return (
            <button
              className="flex w-full items-center truncate text-left text-app-text underline-offset-4 hover:text-app-primary hover:underline disabled:opacity-70 disabled:hover:text-app-text disabled:hover:no-underline"
              onClick={() => {
                if (isGhost) {
                  setSelectedGhostUS(row.id);
                  setShowDetail(true);
                } else {
                  setSelectedGhostUS("");
                  setUserStoryId(row.id);
                }
              }}
              disabled={row.scrumId === -1 && !isGhost}
            >
              {row.name}
            </button>
          );
        },
      },
      epicScrumId: {
        label: "Epic",
        width: 100,
        sortable: true,
        filterable: "search-only",
        filterValue(row) {
          return formatEpicScrumId(row.epicScrumId);
        },
        render(row) {
          return <span>{formatEpicScrumId(row.epicScrumId)}</span>;
        },
      },
      priority: {
        label: "Priority",
        width: 100,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return row.priority?.name ?? "";
        },
        sorter(a, b) {
          if (!a.priority && !b.priority) return 0;
          if (!a.priority) return 1;
          if (!b.priority) return -1;
          return a.priority?.name.localeCompare(b.priority?.name) ? -1 : 1;
        },
        render(row, _, isGhost) {
          const handlePriorityChange = async (tag: Tag) => {
            const rowIndex = userStoryData.indexOf(row);
            if (
              !userStoryData[rowIndex] ||
              userStoryData[rowIndex].priority?.id === tag.id
            ) {
              return; // No update needed
            }
            const [userStoryRow] = userStoryData.splice(rowIndex, 1);
            if (!userStoryRow) {
              return; // Typescript _needs_ this, but it should never happen
            }
            userStoryRow.priority = tag;

            const newData = [...userStoryData, userStoryRow];

            // Uses optimistic update to update the priority of the user story
            await utils.userStories.getUserStoryTable.cancel({
              projectId: projectId as string,
            });

            utils.userStories.getUserStoryTable.setData(
              { projectId: projectId as string },
              newData,
            );

            // Update the priority in the database
            await updateUserStoryTags({
              projectId: projectId as string,
              userStoryId: row.id,
              priorityId: tag.id,
            });

            await invalidateQueriesAllUserStories(projectId as string);
            await invalidateQueriesUserStoriesDetails(projectId as string, [
              row.id,
            ]);
          };

          const handleGhostPriorityChange = (tag: Tag) => {
            updateGhostRow(row.id, (oldData) => ({
              ...oldData,
              priority: tag,
            }));
            generatedUserStories.current = generatedUserStories.current?.map(
              (story) => {
                if (story.id === row.id) {
                  return {
                    ...story,
                    priority: tag,
                  };
                }
                return story;
              },
            );
          };

          return (
            <PriorityPicker
              disabled={permission < permissionNumbers.write}
              priority={row.priority}
              onChange={
                isGhost ? handleGhostPriorityChange : handlePriorityChange
              }
            />
          );
        },
      },
      size: {
        label: "Size",
        width: 100,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return row.size ?? "";
        },
        sorter(a, b) {
          const sizeOrder: Record<Size, number> = {
            XS: 0,
            S: 1,
            M: 2,
            L: 3,
            XL: 4,
            XXL: 5,
          };

          return (sizeOrder[a.size] ?? 99) < (sizeOrder[b.size] ?? 99) ? -1 : 1;
        },
        render(row, _, isGhost) {
          const handleSizeChange = async (size: Size) => {
            const rowIndex = userStoryData.indexOf(row);
            if (!userStoryData[rowIndex]) {
              return; // No update needed
            }
            const [userStoryRow] = userStoryData.splice(rowIndex, 1);
            if (!userStoryRow) {
              return; // Typescript _needs_ this, but it should never happen
            }
            userStoryRow.size = size;

            const newData = [...userStoryData, userStoryRow];

            // Uses optimistic update to update the size of the user story
            await utils.userStories.getUserStoryTable.cancel({
              projectId: projectId as string,
            });
            utils.userStories.getUserStoryTable.setData(
              { projectId: projectId as string },
              newData,
            );

            // Update the size in the database
            await updateUserStoryTags({
              projectId: projectId as string,
              userStoryId: row.id,
              size: size,
            });

            await invalidateQueriesAllUserStories(projectId as string);
            await invalidateQueriesUserStoriesDetails(projectId as string, [
              row.id,
            ]);
          };

          const handleGhostSizeChange = (size: Size) => {
            updateGhostRow(row.id, (oldData) => ({
              ...oldData,
              size: size,
            }));
            generatedUserStories.current = generatedUserStories.current?.map(
              (story) => {
                if (story.id === row.id) {
                  return {
                    ...story,
                    size,
                  };
                }
                return story;
              },
            );
          };

          return (
            <SizePillComponent
              disabled={permission < permissionNumbers.write}
              currentSize={row.size}
              callback={isGhost ? handleGhostSizeChange : handleSizeChange}
            />
          );
        },
      },
      sprintNumber: {
        label: "Sprint",
        width: 100,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return formatSprintNumber(row.sprintNumber).toString();
        },
        render(row) {
          return <span>{formatSprintNumber(row.sprintNumber)}</span>;
        },
      },
      taskProgress: {
        label: "Task progress",
        width: 110,
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

    return (
      <Table
        emptyMessage="No user stories found"
        className={cn("w-[calc(100vw-504px)] overflow-auto", heightOfContent)}
        data={userStoryData}
        columns={tableColumns}
        onDelete={handleDelete}
        multiselect={permission >= permissionNumbers.write}
        deletable={permission >= permissionNumbers.write}
        tableKey="user-stories-table"
        ghostData={ghostData}
        ghostRows={ghostRows}
        setGhostRows={setGhostRows}
        acceptGhosts={onAccept}
        rejectGhosts={onReject}
        ghostLoadingEstimation={5000}
        rowClassName="h-12"
      />
    );
  };

  useEffect(() => {
    setAllowSegmentedControlChange(
      !(generating || (generatedUserStories.current?.length ?? 0) > 0),
    );
  }, [generating, generatedUserStories.current?.length]);
  // #endregion

  return (
    <>
      <div className="flex w-full items-center gap-1 pb-2">
        <SearchBar
          searchValue={searchValue}
          handleUpdateSearch={handleUpdateSearch}
          placeholder="Find a user story by title or Id..."
        ></SearchBar>
        {permission >= permissionNumbers.write && (
          <div className="flex items-center gap-1">
            <PrimaryButton onClick={() => setShowNewStory(true)}>
              + New Story
            </PrimaryButton>
            <AiGeneratorDropdown
              singularLabel="story"
              pluralLabel="stories"
              onGenerate={generateUserStories}
              disabled={generating}
              alreadyGenerated={(ghostData?.length ?? 0) > 0}
              onAcceptAll={onAcceptAll}
              onRejectAll={onRejectAll}
            />
          </div>
        )}
      </div>

      {getTable()}

      {renderDetail && (
        <UserStoryDetailPopup
          showDetail={showDetail}
          userStoryId={selectedUS}
          userStoryData={
            selectedGhostUS !== ""
              ? generatedUserStories.current?.find(
                  (it) => it.id === selectedGhostUS,
                )
              : undefined
          }
          setUserStoryId={(newId) => {
            setUserStoryId(newId);
            if (newId === "" && selectedGhostUS !== "") {
              setShowDetail(false);
              setTimeout(() => setSelectedGhostUS(""), 300);
            }
          }}
          setUserStoryData={(updatedDetail) => {
            if (!selectedGhostUS || !updatedDetail) return;
            updateGhostRow(selectedGhostUS, (oldData) => ({
              ...oldData,
              title: updatedDetail.name,
              description: updatedDetail.description,
              epicScrumId: updatedDetail.epic?.scrumId,
              priority: updatedDetail.priority,
              size: updatedDetail.size ?? "M",
              taskProgress: [0, updatedDetail.tasks.length],
            }));
            generatedUserStories.current = generatedUserStories.current?.map(
              (story) => {
                if (story.id === selectedGhostUS) {
                  return updatedDetail;
                }
                return story;
              },
            );
          }}
          onAccept={async () => {
            setShowDetail(false);
            setTimeout(() => setSelectedGhostUS(""), 300);
            await onAccept([selectedGhostUS]);
          }}
          onReject={() => {
            setShowDetail(false);
            setTimeout(() => {
              onReject([selectedGhostUS]);
              setSelectedGhostUS("");
            }, 300);
          }}
        />
      )}

      {renderNewStory && (
        <CreateUserStoryPopup
          onUserStoryAdded={onUserStoryAdded}
          showPopup={showNewStory}
          setShowPopup={setShowNewStory}
        />
      )}
    </>
  );
}
