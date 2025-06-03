"use client";
import { api } from "~/trpc/react";
import { useState } from "react";
import ProfilePicture from "./ProfilePicture";
import { useFormatAnyScrumId } from "../_hooks/scrumIdHooks";
import { capitalize } from "@mui/material";
import LoadingSpinner from "./LoadingSpinner";
import type { ProjectActivity, WithId } from "~/lib/types/firebaseSchemas";
import {
  getAccentHexColorByCardType,
  getPillColorByActivityType,
} from "~/lib/helpers/colorUtils";
import TagComponent from "./TagComponent";
import { getRelativeTimeString } from "~/lib/helpers/firestoreTimestamp";
import { displayNameByType } from "~/lib/helpers/typeDisplayName";
import SearchBar from "./inputs/search/SearchBar";
import { getSearchableNameByType } from "~/lib/helpers/searchableNames";

const ActivityProjectOverview = ({ projectId }: { projectId: string }) => {
  const { data: activities, isLoading: activitiesLoading } =
    api.projects.getProjectActivities.useQuery({ projectId });
  const { data: users, isLoading: usersLoading } = api.users.getUsers.useQuery({
    projectId,
  });
  const { data: activitiesDetailsMap } =
    api.projects.getActivityDetails.useQuery({ projectId });

  const [searchText, setSearchText] = useState("");

  const formatAnyScrumId = useFormatAnyScrumId();

  const firebaseTimestampToDate = getRelativeTimeString;

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
    if (!activity?.type || !activitiesDetailsMap) return null;
    // Use the unified activity items map to get details
    return activitiesDetailsMap[activity.itemId];
  };

  // Helper function to get item title
  const getItemTitle = (activity: WithId<ProjectActivity>) => {
    const item = getItemDetails(activity);
    if (!item?.name) return "";

    return item.name;
  };

  // Helper function to get scrum ID
  const getScrumId = (activity: WithId<ProjectActivity>) => {
    const item = getItemDetails(activity);

    if (!item) return null;
    return formatAnyScrumId(item.scrumId ?? 0, activity.type);
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
    const typeLabel = getSearchableNameByType(activity.type);

    // Get user information if available
    const user = activity.userId ? userMap[activity.userId] : undefined;
    const userName = user
      ? (user.displayName ?? user.email ?? user.id ?? "")
      : (activity.userId ?? "System");

    const itemTitle = getItemTitle(activity) ?? "";
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

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-row justify-between gap-1 border-b-2 pb-3 align-middle">
        <h1 className="w-full self-center pl-2 text-xl font-semibold">
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

        {filteredActivities?.map((activity) => {
          const user = activity.userId ? userMap[activity.userId] : undefined;
          const itemTitle = getItemTitle(activity);
          const scrumId = getScrumId(activity);
          if (!itemTitle && !scrumId) return null;

          return (
            <div
              key={activity.id}
              className="flex w-full flex-row border-b-2 px-3 py-4 transition hover:bg-gray-100"
            >
              <div className="flex w-3/4 flex-col items-start">
                <h3 className="line-clamp-1 w-full text-ellipsis break-all text-lg font-semibold">
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
                <div className="flex w-full flex-row items-center justify-start">
                  {user ? (
                    <ProfilePicture
                      pictureClassName="self-center"
                      user={user}
                    />
                  ) : activity.userId ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                      <span title={`Unknown user: ${activity.userId}`}>?</span>
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
                  color={getPillColorByActivityType(activity.action)}
                  darkBackground={true}
                >
                  {capitalize(activity.action || "")}
                </TagComponent>

                {/* Type badges - keep as is */}
                <TagComponent
                  color={getAccentHexColorByCardType(activity.type)}
                  darkBackground={true}
                >
                  {displayNameByType[activity.type]}
                </TagComponent>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityProjectOverview;
