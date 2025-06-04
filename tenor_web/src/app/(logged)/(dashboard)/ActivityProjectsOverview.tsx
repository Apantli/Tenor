"use client";
import { api } from "~/trpc/react";
import { useState } from "react";
import { capitalize } from "@mui/material";
import {
  getAccentHexColorByCardType,
  getPillColorByActivityType,
} from "~/lib/helpers/colorUtils";
import { getRelativeTimeString } from "~/lib/helpers/firestoreTimestamp";
import { displayNameByType } from "~/lib/helpers/typeDisplayName";
import { getSearchableNameByType } from "~/lib/helpers/searchableNames";
import TagComponent from "~/app/_components/TagComponent";
import SearchBar from "~/app/_components/inputs/search/SearchBar";
import ProfilePicture from "~/app/_components/ProfilePicture";
import type {
  ProjectActivityDetail,
  WithId,
  WithProjectId,
} from "~/lib/types/firebaseSchemas";

const ActivityProjectsOverview = () => {
  const { data: users, isLoading: usersLoading } =
    api.users.getGlobalUsers.useQuery({});
  const { data: projects, isLoading: projectsLoading } =
    api.projects.listProjects.useQuery();
  const { data: activities, isLoading: activitiesLoading } =
    api.projects.getTopActivityDetails.useQuery();

  const [searchText, setSearchText] = useState("");
  const firebaseTimestampToDate = getRelativeTimeString;

  // scrum cannot be calculated with hooks as it needs the projectId beforehand
  const getScrumId = (item: WithProjectId<WithId<ProjectActivityDetail>>) => {
    return item.type + item.scrumId.toString();
  };

  // Create a better user map that tries multiple ID fields
  const userMap = users
    ? users.reduce(
        (map, user) => {
          if (user.id) map[user.id] = user;
          if (user.email) map[user.email] = user;
          return map;
        },
        {} as Record<string, (typeof users)[0]>,
      )
    : {};

  const projectMap = projects
    ? projects.reduce(
        (map, project) => {
          if (project.id) map[project.id] = project;
          return map;
        },
        {} as Record<string, (typeof projects)[0]>,
      )
    : {};

  // 2. NOW USE THE FUNCTIONS IN FILTERS AND SORTING
  // Filter activities based on search
  const filteredActivities = activities?.filter((item) => {
    if (!searchText) return true;

    const searchLowerCase = searchText.toLowerCase();

    // Prepare all searchable fields
    const dateStr = item.date ? String(item.date) : "";
    const actionStr = item.action ?? "";
    const typeStr = item.type ?? "";

    // Add readable type label for search
    const typeLabel = getSearchableNameByType(item.type);

    // Get user information if available
    const user = item.userId ? userMap[item.userId] : undefined;
    const userName = user
      ? (user.displayName ?? user.email ?? user.id ?? "")
      : (item.userId ?? "System");

    const itemTitle = item.name;
    const scrumId = getScrumId(item);

    // Check if any field contains the search text
    return (
      dateStr.toLowerCase().includes(searchLowerCase) ||
      actionStr.toLowerCase().includes(searchLowerCase) ||
      typeStr.toLowerCase().includes(searchLowerCase) ||
      typeLabel.toLowerCase().includes(searchLowerCase) ||
      userName.toLowerCase().includes(searchLowerCase) ||
      itemTitle.toLowerCase().includes(searchLowerCase) ||
      scrumId.toString().toLowerCase().includes(searchLowerCase)
    );
  });

  const isLoading: boolean =
    activitiesLoading || usersLoading || projectsLoading;

  return (
    <div className="flex h-[40vh] max-h-[580px] flex-col overflow-hidden rounded-lg border-2 border-[#BECAD4] p-5">
      <div className="flex flex-row justify-between gap-1 border-b-2 pb-5">
        <h3 className="w-full self-center text-lg font-bold">
          Recent Project Activity
        </h3>
        <SearchBar
          searchValue={searchText}
          handleUpdateSearch={(e) => setSearchText(e.target.value)}
          placeholder="Search activities"
        ></SearchBar>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!isLoading && (!activities || activities.length === 0) && (
          <div className="mt-[calc(40vh-230px)] flex w-full items-center justify-center">
            <div className="flex flex-col items-center gap-5">
              <span className="-mb-10 text-[100px] text-gray-500"></span>
              <h1 className="mb-5 text-3xl font-semibold text-gray-500">
                No activities yet
              </h1>
            </div>
          </div>
        )}

        {filteredActivities?.map((item) => {
          const user = item.userId ? userMap[item.userId] : undefined;
          const project = item.projectId
            ? projectMap[item.projectId]
            : undefined;
          const itemTitle = item.name;
          const scrumId = getScrumId(item);
          if (!itemTitle && !scrumId) return null;

          return (
            <div
              key={item.id}
              className="flex w-full flex-row border-b-2 px-3 py-4 transition hover:bg-gray-100"
            >
              <div className="flex w-1/2 flex-col items-start justify-start space-y-3">
                <h3 className="mb-3 line-clamp-1 w-full text-ellipsis break-all text-lg font-semibold">
                  {scrumId && (
                    <>
                      {scrumId}
                      {itemTitle && (
                        <>
                          : <span className="font-normal">{itemTitle}</span>
                        </>
                      )}
                    </>
                  )}
                </h3>
                <div className="flex w-full flex-row items-center justify-start space-x-4">
                  {user ? (
                    <ProfilePicture
                      pictureClassName="self-center"
                      user={user}
                    />
                  ) : item.userId ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                      <span title={`Unknown user: ${item.userId}`}>?</span>
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">
                      <span>-</span>
                    </div>
                  )}

                  <div className="flex flex-col space-y-1 pl-2">
                    {/* Show generic user label or system */}
                    <p className="mb-1 text-xs text-gray-600">
                      {item.userId ? "" : "System"}
                    </p>

                    {/* Show date */}
                    {item.date && (
                      <p className="text-s text-blakc self-center">
                        {firebaseTimestampToDate(item.date)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex w-1/2 flex-col items-end justify-end pl-3">
                {project && (
                  <div className="mb-2 flex h-[40px] w-[40px] min-w-[40px] items-center justify-center overflow-hidden rounded-md border-2 bg-white">
                    <img
                      className="h-full w-full rounded-md object-contain p-[2px]"
                      src={
                        project.logo.startsWith("/")
                          ? project.logo
                          : `/api/image_proxy/?url=${encodeURIComponent(
                              project.logo,
                            )}`
                      }
                      alt={project.name}
                    />
                  </div>
                )}
                <div className="flex flex-row items-center justify-end gap-3">
                  <TagComponent
                    color={getPillColorByActivityType(item.action)}
                    darkBackground={true}
                  >
                    {capitalize(item.action || "")}
                  </TagComponent>
                  <TagComponent
                    color={getAccentHexColorByCardType(item.type)}
                    darkBackground={true}
                  >
                    {displayNameByType[item.type]}
                  </TagComponent>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityProjectsOverview;
