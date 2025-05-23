"use client";
import { api } from "~/trpc/react";
import SearchBar from "./SearchBar";
import { useState, useEffect } from "react";
import ProfilePicture from "./ProfilePicture";
import { useFormatEpicScrumId, useFormatIssueScrumId, useFormatSprintNumber, useFormatTaskScrumId, useFormatUserStoryScrumId } from "../_hooks/scrumIdHooks";
import { capitalize } from "@mui/material";
import LoadingSpinner from "./LoadingSpinner";

const ActivityProjectOverview = ({ projectId }: { projectId: string }) => {
  const { data: activities, isLoading: activitiesLoading } = api.projects.getProjectActivities.useQuery({ projectId });
  const { data: users, isLoading: usersLoading } = api.users.getUsers.useQuery({ projectId });
  const { data: activitiesDetails, isLoading: activitiesDetailsLoading } = api.projects.getActivityDetails.useQuery({ projectId });

  const formatTaskScrumId = useFormatTaskScrumId();
  const formatIssueScrumId = useFormatIssueScrumId();
  const formatEpicScrumId = useFormatEpicScrumId();
  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const formatSprintScrumId = useFormatSprintNumber();
  
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
  }, {} as Record<string, any>) || {};

  const issueMap = activitiesDetails?.issuesActivities?.reduce((map, issue) => {
    if (issue.id) map[issue.id] = issue;
    return map;
  }, {} as Record<string, any>) || {};

  const epicMap = activitiesDetails?.epicsActivities?.reduce((map, epic) => {
    if (epic.id) map[epic.id] = epic;
    return map;
  }, {} as Record<string, any>) || {};

  const sprintMap = activitiesDetails?.sprintsActivities?.reduce((map, sprint) => {
    if (sprint.id) map[sprint.id] = sprint;
    return map;
  }, {} as Record<string, any>) || {};

  const userStoryMap = activitiesDetails?.userStoriesActivities?.reduce((map, userStory) => {
    if (userStory.id) map[userStory.id] = userStory;
    return map;
  }, {} as Record<string, any>) || {};

  // 1. DEFINE HELPER FUNCTIONS FIRST
  // Helper function to get item details based on activity type and itemId
  const getItemDetails = (activity: any) => {
    if (!activity?.type || !activity?.itemId) return null;
    
    const type = activity.type;
    const itemId = activity.itemId;
    
    if (type === 'TS') return taskMap[itemId];
    if (type === 'IS') return issueMap[itemId];
    if (type === 'EP') return epicMap[itemId];
    if (type === 'SP') return sprintMap[itemId];
    if (type === 'US' || type === 'user story') return userStoryMap[itemId];
    
    return null;
  };

  // Helper function to get item title
  const getItemTitle = (activity: any) => {
    const item = getItemDetails(activity);
    if (!item){
      return activity.itemId;
    } 
    
    // Different item types might store their titles in different properties
    return item.name;
  };

  // Helper function to get scrum ID
  const getScrumId = (activity: any) => {
    const item = getItemDetails(activity);
    if (!item) return null;

    if (activity.type === 'TS'){
      return formatTaskScrumId(item.scrumId);
    }
    if (activity.type === 'IS'){
      return formatIssueScrumId(item.scrumId);
    }
    if (activity.type === 'EP'){
      return formatEpicScrumId(item.scrumId);
    }
    if (activity.type === 'SP'){
      return formatSprintScrumId(item.scrumId);
    }
    if (activity.type === 'US'){
      return formatUserStoryScrumId(item.scrumId);
    }

    return item.scrumId;
  };

  // Helper function to format date from Firestore timestamp
  const getRelativeTimeString = (date: any): string => {
    if (!date) return '';

    let jsDate;

    // Convert various timestamp formats to JavaScript Date
    if (typeof date === 'object' && date !== null) {
      if (date._seconds !== undefined) {
        jsDate = new Date(date._seconds * 1000);
      } else if (date.seconds !== undefined) {
        jsDate = new Date(date.seconds * 1000);
      } else if (date instanceof Date) {
        jsDate = date;
      } else if (typeof date.toDate === 'function') {
        jsDate = date.toDate();
      } else {
        try {
          jsDate = new Date(date);
        } catch (e) {
          return '';
        }
      }
    } else {
      try {
        jsDate = new Date(date);
      } catch (e) {
        return '';
      }
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - jsDate.getTime()) / 1000);

    // Convert to appropriate time unit
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffInSeconds < 2419200) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInSeconds < 29030400) {
      const months = Math.floor(diffInSeconds / 2419200);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 29030400);
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
    const actionStr = activity.action || "";
    const typeStr = activity.type || "";
    
    // Get user information if available
    const user = activity.userId ? userMap[activity.userId] : undefined;
    const userName = user
      ? (user.displayName || user.email || user.id || "")
      : activity.userId || "System";
    
    // Get item title
    const itemTitle = getItemTitle(activity) || "";
    
    // Get scrum ID
    const scrumId = getScrumId(activity) || "";
    
    // Check if any field contains the search text
    return (
      dateStr.toLowerCase().includes(searchLowerCase) ||
      actionStr.toLowerCase().includes(searchLowerCase) ||
      typeStr.toLowerCase().includes(searchLowerCase) ||
      userName.toLowerCase().includes(searchLowerCase) ||
      itemTitle.toLowerCase().includes(searchLowerCase) ||
      scrumId.toString().toLowerCase().includes(searchLowerCase)
    );
  });

  // Sort activities by date (most recent first)
  const sortedActivities = filteredActivities?.sort((a, b) => {
    // Handle missing dates
    if (!a.date) return 1;  // a comes after b
    if (!b.date) return -1; // b comes after a
    
    // Extract timestamps for comparison
    let timestampA: number;
    let timestampB: number;

    // Define a type for Firestore-like timestamps
    type FirestoreTimestamp = { _seconds?: number; seconds?: number };

    // Handle Firestore timestamp format
    if (typeof a.date === 'object' && a.date !== null && !(a.date instanceof Date)) {
      const dateObj = a.date as FirestoreTimestamp;
      timestampA = dateObj._seconds !== undefined ? dateObj._seconds :
                  (dateObj.seconds !== undefined ? dateObj.seconds :
                  new Date(a.date as any).getTime() / 1000);
    } else {
      timestampA = new Date(a.date).getTime() / 1000;
    }

    if (typeof b.date === 'object' && b.date !== null && !(b.date instanceof Date)) {
      const dateObj = b.date as FirestoreTimestamp;
      timestampB = dateObj._seconds !== undefined ? dateObj._seconds :
                  (dateObj.seconds !== undefined ? dateObj.seconds :
                  new Date(b.date as any).getTime() / 1000);
    } else {
      timestampB = new Date(b.date).getTime() / 1000;
    }
    
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
                  {scrumId}: {itemTitle}
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