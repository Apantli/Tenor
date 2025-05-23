"use client";
import { api } from "~/trpc/react";
import SearchBar from "./SearchBar";
import { useState } from "react";
import ProfilePicture from "./ProfilePicture";
import { useFormatEpicScrumId, useFormatIssueScrumId, useFormatTaskScrumId, useFormatUserStoryScrumId } from "../_hooks/scrumIdHooks";
import { capitalize } from "@mui/material";
import LoadingSpinner from "./LoadingSpinner";
import type { Epic, Issue, ProjectActivity, Sprint, Task, UserStory, WithId } from "~/lib/types/firebaseSchemas";

type WithActivity<T> = T & { activity: WithId<ProjectActivity> };
type ItemWithName =
  | WithId<Task>
  | WithId<Issue>
  | WithId<UserStory>
  | WithId<Epic>
  | WithId<Sprint>;

type ItemWithScrumId = { scrumId: number };

type PossibleItem = {
  scrumId?: unknown;
  id?: string; 
  name?: string;
}

const hasScrumId = (item: PossibleItem): item is ItemWithScrumId => {
  return item && typeof item.scrumId === 'number';
};

type PossibleDate =
  | Date
  | { _seconds: number }
  | { seconds: number }
  | { toDate: () => Date }
  | string
  | number;

const ActivityProjectOverview = ({ projectId }: { projectId: string }) => {
  const { data: activities, isLoading: activitiesLoading } = api.projects.getProjectActivities.useQuery({ projectId });
  const { data: users, isLoading: usersLoading } = api.users.getUsers.useQuery({ projectId });
  const { data: activitiesDetails, isLoading: activitiesDetailsLoading } = api.projects.getActivityDetails.useQuery({ projectId });

  const formatTaskScrumId = useFormatTaskScrumId();
  const formatIssueScrumId = useFormatIssueScrumId();
  const formatEpicScrumId = useFormatEpicScrumId();
  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  
  const [searchText, setSearchText] = useState("");

  // Create a better user map that tries multiple ID fields
  const userMap = users
    ? users.reduce((map, user) => {
        if (user.id) map[user.id] = user;
        if (user.email) map[user.email] = user;
        return map;
      }, {} as Record<string, typeof users[0]>)
    : {};

  // Create lookup maps for different item types
  const taskMap = activitiesDetails?.tasksActivities?.reduce((map, task) => {
    if (task.id) map[task.id] = task;
    return map;
  }, {} as Record<string, WithActivity<WithId<Task>>>) ?? {};

  const issueMap = activitiesDetails?.issuesActivities?.reduce((map, issue) => {
    if (issue.id) map[issue.id] = issue;
    return map;
  }, {} as Record<string, WithActivity<WithId<Issue>>>) ?? {};

  const epicMap = activitiesDetails?.epicsActivities?.reduce((map, epic) => {
    if (epic.id) map[epic.id] = epic;
    return map;
  }, {} as Record<string, WithActivity<WithId<Epic>>>) ?? {};

  const sprintMap = activitiesDetails?.sprintsActivities?.reduce((map, sprint) => {
    if (sprint.id) map[sprint.id] = sprint;
    return map;
  }, {} as Record<string, WithActivity<WithId<Sprint>>>) ?? {};

  const userStoryMap = activitiesDetails?.userStoriesActivities?.reduce((map, userStory) => {
    if (userStory.id) map[userStory.id] = userStory;
    return map;
  }, {} as Record<string, WithActivity<WithId<UserStory>>>) ?? {};

  // 1. DEFINE HELPER FUNCTIONS FIRST
  // Helper function to get item details based on activity type and itemId
  const getItemDetails = (activity: WithId<ProjectActivity>): ItemWithName | null => {
    if (!activity?.type || !activity?.itemId) return null;
    
    const { type, itemId } = activity;

    if (type === 'TS') return taskMap[itemId] ?? null;
    if (type === 'IS') return issueMap[itemId] ?? null;
    if (type === 'EP') return epicMap[itemId] ?? null;
    if (type === 'SP') return sprintMap[itemId] ?? null;
    if (type === 'US') return userStoryMap[itemId] ?? null;
    
    return null;
  };

  // Helper function to get item title
  const getItemTitle = (activity: WithId<ProjectActivity>) => {
    const item = getItemDetails(activity);
    if (!item) return activity.itemId;

    if (activity.type === 'SP') {
      const sprint = item as WithId<Sprint>;
      return `Sprint ${sprint.number}`;
    }

    if ('name' in item && typeof item.name === 'string') {
      return item.name;
    }

    return activity.itemId;
  };



  // Helper function to get scrum ID
  const getScrumId = (activity: WithId<ProjectActivity>) => {
    const item = getItemDetails(activity);
    if (!item) return null;

    if (activity.type === 'SP') {
      const sprint = item as WithId<Sprint>;
      if (sprint.number !== undefined && sprint.number !== null) {
        return `Sprint ${sprint.number}`;
      }
      return `Sprint (${activity.itemId})`;
    }

    if (hasScrumId(item)) {
      switch (activity.type) {
        case 'TS':
          return formatTaskScrumId(item.scrumId) + ":";
        case 'IS':
          return formatIssueScrumId(item.scrumId) + ":";
        case 'EP':
          return formatEpicScrumId(item.scrumId) + ":";
        case 'US':
          return formatUserStoryScrumId(item.scrumId) + ":";
      }
    }

    return null;
  };


  // Helper function to format date from Firestore timestamp
  const getRelativeTimeString = (date: PossibleDate): string => {
    if (!date) return '';

    let jsDate: Date | null = null;

    if (typeof date === 'object' && date !== null) {
      if ('_seconds' in date) {
        jsDate = new Date(date._seconds * 1000);
      } else if ('seconds' in date) {
        jsDate = new Date(date.seconds * 1000);
      } else if (date instanceof Date) {
        jsDate = date;
      } else if (typeof (date as { toDate?: () => Date }).toDate === 'function') {
        jsDate = (date as { toDate: () => Date }).toDate();
      } else {
        jsDate = new Date((date as unknown) as string | number);
      }
    } else {
      jsDate = new Date(date);
    }

    if (!jsDate || isNaN(jsDate.getTime())) return '';

    // Resto de la función igual
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - jsDate.getTime()) / 1000);

    const MINUTE = 60;
    const HOUR = 3600;
    const DAY = 86400;
    const WEEK = 604800;
    const MONTH = 2419200;
    const YEAR = 29030400;

    if (diffInSeconds < MINUTE) {
      return 'just now';
    } else if (diffInSeconds < HOUR) {
      const minutes = Math.floor(diffInSeconds / MINUTE);
      return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
    } else if (diffInSeconds < DAY) {
      const hours = Math.floor(diffInSeconds / HOUR);
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
    } else if (diffInSeconds < WEEK) {
      const days = Math.floor(diffInSeconds / DAY);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffInSeconds < MONTH) {
      const weeks = Math.floor(diffInSeconds / WEEK);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInSeconds < YEAR) {
      const months = Math.floor(diffInSeconds / MONTH);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / YEAR);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
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
    
    // Get user information if available
    const user = activity.userId ? userMap[activity.userId] : undefined;
    const userName = user
      ? (user.displayName ?? user.email ?? user.id ?? "")
      : activity.userId ?? "System";
    
    // Get item title
    const itemTitle = getItemTitle(activity) ?? "";
    
    // Get scrum ID
    const scrumId = getScrumId(activity) ?? "";
    
    // Check if any field contains the search text
    return (
      dateStr.toLowerCase().includes(searchLowerCase) ??
      actionStr.toLowerCase().includes(searchLowerCase) ??
      typeStr.toLowerCase().includes(searchLowerCase) ??
      userName.toLowerCase().includes(searchLowerCase) ??
      itemTitle.toLowerCase().includes(searchLowerCase) ??
      scrumId.toString().toLowerCase().includes(searchLowerCase)
    );
  });

  // Sort activities by date (most recent first)
  const sortedActivities = filteredActivities?.sort((a, b) => {
    // Handle missing dates
    if (!a.date) return 1;
    if (!b.date) return -1;

    const getTimestamp = (date: unknown): number => {
      if (date instanceof Date) return date.getTime() / 1000;
        
      if (typeof date === 'object' && date !== null) {
        const d = date as { _seconds?: number; seconds?: number; toDate?: () => Date };
      
        if (d._seconds !== undefined) return d._seconds;
        if (d.seconds !== undefined) return d.seconds;
        if (typeof d.toDate === 'function') return d.toDate().getTime() / 1000;
      }
    
      if (typeof date === 'string' || typeof date === 'number') {
        return new Date(date).getTime() / 1000;
      }
    
      return 0; // fallback
    };

    const timestampA = getTimestamp(a.date);
    const timestampB = getTimestamp(b.date);

    // Sort in descending order (newest first)
    return timestampB - timestampA;
  });


  const isLoading = activitiesLoading || usersLoading || activitiesDetailsLoading;

  if (isLoading) {
    return (
      <div className="w-full flex h-full items-center justify-center">
        <LoadingSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-row justify-between gap-1 border-b-2 pb-5">
        <h1 className="w-full text-2xl self-center font-semibold">Recent Project Activity</h1>
        <SearchBar
          searchValue={searchText}
          handleUpdateSearch={(e) => setSearchText(e.target.value)}
          placeholder="Search activities"
        ></SearchBar>
      </div>
      <div className="flex h-64 flex-col overflow-y-auto">
        {!isLoading && (!activities || activities.length === 0) && (
          <div className="mt-[calc(40vh-230px)] flex w-full items-center justify-center">
            <div className="flex flex-col items-center gap-5">
              <span className="-mb-10 text-[100px] text-gray-500"></span>
              <h1 className="mb-5 text-3xl font-semibold text-gray-500">No activities yet</h1>
            </div>
          </div>
        )}

        {sortedActivities?.map((activity) => {
          // Try to match user by userId - will work if userId matches any of our mapped fields
          const user = activity.userId ? userMap[activity.userId] : undefined;
          const itemTitle = getItemTitle(activity);
          const scrumId = getScrumId(activity);

          return (
            <div
              key={activity.id}
              className="border-b-2 px-3 py-4 flex flex-row w-full transition hover:bg-gray-100"
            >
              <div className="flex items-start flex-col w-3/4">                
                <h3 className="text-xl font-semibold">
                  {scrumId} {itemTitle}
                </h3>
                <div className="flex flex-row w-full items-center justify-start">
                  {user ? (
                    <ProfilePicture pictureClassName="self-center" user={user} />
                  ) : activity.userId ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
                      <span title={`Unknown user: ${activity.userId}`}>?</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 text-xs">
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
                        {getRelativeTimeString(activity.date)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-end justify-around w-1/4">
                {/* Action tag with dynamic background color */}
                <p className={`text-sm px-2 py-1 text-white rounded-lg ${
                  activity.action?.toLowerCase().includes("create") 
                    ? "bg-green-500" 
                    : activity.action?.toLowerCase().includes("update") || activity.action?.toLowerCase().includes("change")
                    ? "bg-amber-500"
                    : activity.action?.toLowerCase().includes("delete") || activity.action?.toLowerCase().includes("remove")
                    ? "bg-red-500"
                    : "text-gray-500"
                }`}>
                  {capitalize(activity.action || "")}
                </p>
                
                {/* Type badges - keep as is */}
                {activity.type === "TS" && (
                  <p className="text-sm text-white bg-[#13918A] rounded-lg px-2 py-1">
                    {activity.type === "TS" && "Task"}
                  </p>
                )}
                {activity.type === "IS" && (
                  <p className="text-sm text-white bg-[#15734F] rounded-lg px-2 py-1">
                    {activity.type === "IS" && "Issue"}
                  </p>
                )}
                {activity.type === "EP" && (
                  <p className="text-sm text-white bg-[#012112] rounded-lg px-2 py-1">
                    {activity.type === "EP" && "Epic"}
                  </p>
                )}
                {activity.type === "SP" && (
                  <p className="text-sm text-white bg-[#184723] rounded-lg px-2 py-1">
                    {activity.type === "SP" && "Sprint"}
                  </p>
                )}
                {activity.type === "US" && (
                  <p className="text-sm text-white bg-[#88BB87] rounded-lg px-2 py-1">
                    {activity.type === "US" && "US"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ActivityProjectOverview;