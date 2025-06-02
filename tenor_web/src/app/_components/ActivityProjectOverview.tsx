"use client";
import { api } from "~/trpc/react";
import { useState } from "react";
import ProfilePicture from "./ProfilePicture";
import { useFormatAnyScrumId } from "../_hooks/scrumIdHooks";
import { capitalize } from "@mui/material";
import LoadingSpinner from "./LoadingSpinner";
import type {
  ActionType,
  BacklogItemAndTaskDetailType,
  ProjectActivity,
  WithId,
} from "~/lib/types/firebaseSchemas";
import {
  getAccentColorByCardType,
  getPillColorByActivityType,
} from "~/lib/helpers/colorUtils";
import TagComponent from "./TagComponent";
import { getRelativeTimeString } from "~/lib/helpers/firestoreTimestamp";
import { useActivityItemsMap } from "~/lib/types/activityMappint";
import { getTypeDisplayName } from "~/lib/helpers/typeDisplayName";
import SearchBar from "./inputs/search/SearchBar";

const ActivityProjectOverview = ({ projectId }: { projectId: string }) => {
  const { data: activities, isLoading: activitiesLoading } =
    api.projects.getProjectActivities.useQuery({ projectId });
  const { data: users, isLoading: usersLoading } = api.users.getUsers.useQuery({
    projectId,
  });

  const [searchText, setSearchText] = useState("");

  const formatAnyScrumId = useFormatAnyScrumId(projectId);

  const firebaseTimestampToDate = getRelativeTimeString;

  // Single unified map for all activity items
  const activityItemsMap = useActivityItemsMap(projectId) ?? {};

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

  const getItemDetails = (activity: WithId<ProjectActivity>) => {
    if (!activity?.type) return null;
    // Use the unified activity items map to get details
    return activityItemsMap[activity.itemId] ?? null;
  };

  // Helper function to get item title
  const getItemTitle = (activity: WithId<ProjectActivity>) => {
    const item = getItemDetails(activity);
    if (!item) return activity.itemId;

    return item.name || activity.itemId;
  };

  // Helper function to get scrum ID
  const getScrumId = (activity: WithId<ProjectActivity>) => {
    const item = getItemDetails(activity);
    if (!item) return null;
    return formatAnyScrumId(item.scrumId ?? 0, activity.type) + ":";
  };

  // 2. NOW USE THE FUNCTIONS IN FILTERS AND SORTING
  // Filter activities based on search
  const filteredActivities = activities?.filter((activity) => {
    if (!searchText) return true;

    const searchLowerCase = searchText.toLowerCase();

    // Prepare all searchable fields
    const dateStr = activity.date ? String(activity.date) : "";
    const actionStr = activity.action ?? "";
    const typeStr = activity.type ?? "";

    // Add readable type label for search
    const typeLabel = getTypeDisplayName(activity.type, "search");

    // Get user information if available
    const user = activity.userId ? userMap[activity.userId] : undefined;
    const userName = user
      ? (user.displayName ?? user.email ?? user.id ?? "")
      : (activity.userId ?? "System");

    // Get item title
    const itemTitle = getItemTitle(activity) ?? "";

    // Get scrum ID
    const scrumId = getScrumId(activity) ?? "";

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

  const isLoading = activitiesLoading || usersLoading;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border-2 border-[#BECAD4] p-3">
      <div className="flex flex-row justify-between gap-1 border-b-2 pb-5">
        <h1 className="w-full self-center text-2xl font-semibold">
          Recent Project Activity
        </h1>
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
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center py-24">
            <LoadingSpinner color="primary" />
          </div>
        ) : (
          filteredActivities?.map((activity) => {
            // Try to match user by userId - will work if userId matches any of our mapped fields
            const user = activity.userId ? userMap[activity.userId] : undefined;
            const itemTitle = getItemTitle(activity);
            const scrumId = getScrumId(activity);

            return (
              <div
                key={activity.id}
                className="flex w-full flex-row border-b-2 px-3 py-4 transition hover:bg-gray-100"
              >
                <div className="flex w-3/4 flex-col items-start">
                  <h3 className="line-clamp-1 w-full text-ellipsis break-all text-lg font-semibold">
                    {activity.type === "SP" && <span>Sprint</span>}
                    {scrumId && (
                      <>
                        {scrumId}{" "}
                        <span className="font-normal">{itemTitle}</span>{" "}
                      </>
                    )}
                  </h3>
                  <div className="flex w-full flex-row items-center justify-start">
                    {user ? (
                      <ProfilePicture
                        pictureClassName="self-center"
                        user={user}
                      />
                    ) : activity.userId ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                        <span title={`Unknown user: ${activity.userId}`}>
                          ?
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">
                        <span>-</span>
                      </div>
                    )}

                    <div className="flex flex-col pl-2">
                      {/* Show generic user label or system */}
                      <p className="text-xs text-gray-600">
                        {activity.userId ? "" : "System"}
                      </p>

                      {/* Show date */}
                      {activity.date && (
                        <p className="text-s text-blakc self-center">
                          {firebaseTimestampToDate(activity.date)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex w-1/4 flex-row items-end justify-end gap-3">
                  {/* Action tag with dynamic background color */}
                  <TagComponent
                    className={`rounded-lg text-white ${getPillColorByActivityType(
                      activity.action?.toLowerCase() as ActionType,
                    )}`}
                  >
                    {capitalize(activity.action || "")}
                  </TagComponent>

                  {/* Type badges - keep as is */}
                  <TagComponent
                    className={`rounded-lg text-white ${getAccentColorByCardType(activity.type as BacklogItemAndTaskDetailType)}`}
                  >
                    {getTypeDisplayName(activity.type)}
                  </TagComponent>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityProjectOverview;
