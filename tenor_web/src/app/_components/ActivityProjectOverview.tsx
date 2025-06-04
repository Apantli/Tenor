"use client";
import { api } from "~/trpc/react";
import { useState } from "react";
import ProfilePicture from "./ProfilePicture";
import { useFormatAnyScrumId } from "../_hooks/scrumIdHooks";
import { capitalize } from "@mui/material";
import {
  getAccentHexColorByCardType,
  getPillColorByActivityType,
} from "~/lib/helpers/colorUtils";
import TagComponent from "./TagComponent";
import { getRelativeTimeString } from "~/lib/helpers/firestoreTimestamp";
import { displayNameByType } from "~/lib/helpers/typeDisplayName";
import SearchBar from "./inputs/search/SearchBar";
import { getSearchableNameByType } from "~/lib/helpers/searchableNames";
import { cn } from "~/lib/helpers/utils";
import type { ClassNameValue } from "tailwind-merge";
import NoActivityIcon from "@mui/icons-material/FormatListBulleted";
import LoadingSpinner from "./LoadingSpinner";

interface Props {
  projectId: string;
  className?: ClassNameValue;
}

const ActivityProjectOverview = ({ projectId, className }: Props) => {
  const { data: users, isLoading: usersLoading } = api.users.getUsers.useQuery({
    projectId,
  });
  const { data: activities, isLoading: activitiesLoading } =
    api.projects.getActivityDetails.useQuery({ projectId });

  const [searchText, setSearchText] = useState("");
  const firebaseTimestampToDate = getRelativeTimeString;
  const formatAnyScrumId = useFormatAnyScrumId(projectId);

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
    const scrumId = formatAnyScrumId(item.scrumId ?? 0, item.type);

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
    <div
      className={cn(
        "flex h-[40vh] max-h-[580px] flex-col overflow-hidden rounded-lg border-2 border-[#BECAD4] p-5",
        className,
      )}
    >
      <div className="flex flex-row justify-between gap-1 border-b-2 pb-5">
        <h3 className="w-full self-center text-xl font-semibold">
          Recent Project Activity
        </h3>
        <SearchBar
          searchValue={searchText}
          handleUpdateSearch={(e) => setSearchText(e.target.value)}
          placeholder="Search activities"
        ></SearchBar>
      </div>
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {(!activities || activities.length === 0) && (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <span className="text-[100px] text-gray-500">
                <NoActivityIcon fontSize="inherit" />
              </span>
              <h1 className="mb-5 text-2xl font-semibold text-gray-500">
                No activity yet
              </h1>
            </div>
          )}

          {filteredActivities?.map((item) => {
            const user = item.userId ? userMap[item.userId] : undefined;
            const itemTitle = item.name;
            const scrumId = formatAnyScrumId(item.scrumId ?? 0, item.type);
            if (!itemTitle && !scrumId) return null;

            return (
              <div
                key={item.id}
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
                    ) : item.userId ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                        <span title={`Unknown user: ${item.userId}`}>?</span>
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">
                        <span>-</span>
                      </div>
                    )}

                    <div className="flex flex-col pl-2">
                      {/* Show generic user label or system */}
                      <p className="text-xs text-gray-600">
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
                <div className="flex w-1/4 flex-row items-end justify-end gap-3">
                  {/* Action tag with dynamic background color */}
                  <TagComponent
                    color={getPillColorByActivityType(item.action)}
                    reducedPadding
                  >
                    {capitalize(item.action || "")}
                  </TagComponent>

                  {/* Type badges - keep as is */}
                  <TagComponent
                    color={getAccentHexColorByCardType(item.type)}
                    reducedPadding
                  >
                    {displayNameByType[item.type]}
                  </TagComponent>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityProjectOverview;
