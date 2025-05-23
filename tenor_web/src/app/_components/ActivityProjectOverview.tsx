"use client";
import { api } from "~/trpc/react";
import SearchBar from "./SearchBar";
import { useState, useEffect } from "react";
import ProfilePicture from "./ProfilePicture";

const ActivityProjectOverview = ({ projectId }: { projectId: string }) => {
  // Get activities and users
  const { data: activities, isLoading: activitiesLoading } = api.projects.getProjectActivities.useQuery({ projectId });
  // Use the other users endpoint which seems more reliable
  const { data: users, isLoading: usersLoading } = api.users.getUsers.useQuery({ projectId });

  const [searchText, setSearchText] = useState("");

  // Log the first few items to debug
  useEffect(() => {
    console.log("First activity:", activities?.[0]);
    console.log("First user:", users?.[0]);
  }, [activities, users]);

  // Create a better user map that tries multiple ID fields
  const userMap = users
    ? users.reduce((map, user) => {
        // Try each possible ID field that might match userId in activities
        if (user.id) map[user.id] = user;
        if (user.email) map[user.email] = user;
        
        return map;
      }, {} as Record<string, typeof users[0]>)
    : {};

  // Filter activities based on search
  const filteredActivities = activities?.filter((activity) => {
    const dateStr = activity.date ? String(activity.date) : "";
    return (dateStr + activity.type + activity.action).toLowerCase().includes(searchText.toLowerCase());
  });

  const isLoading = activitiesLoading || usersLoading;

  return (
    <>
      <div className="flex flex-row justify-between gap-1 border-b-2 pb-5">
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

        {filteredActivities?.map((activity) => {
          // Try to match user by userId - will work if userId matches any of our mapped fields
          const user = activity.userId ? userMap[activity.userId] : undefined;

          return (
            <div
              key={activity.id}
              className="border-b-2 px-3 py-4 transition hover:cursor-pointer hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                {/* Only show ProfilePicture if we found a matching user */}
                {user && <ProfilePicture user={user} />}

                <div className="flex flex-col gap-y-2">
                  <h3 className="text-xl font-semibold">
                    {activity.type} - {activity.action}
                  </h3>
                  <p className="text-sm">{activity.itemId}</p>

                  {/* Show user info if found, otherwise show userId */}
                  {user ? (
                    <p className="text-xs text-gray-600">
                      By: {user.displayName || user.email}
                    </p>
                  ) : activity.userId ? (
                    <p className="text-xs text-gray-600">By user: {activity.userId}</p>
                  ) : null}

                  {activity.date && (
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ActivityProjectOverview;