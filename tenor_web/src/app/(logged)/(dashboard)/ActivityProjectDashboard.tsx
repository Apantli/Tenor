"use client";
import { api } from "~/trpc/react";
import { useState } from "react";
import { getSearchableNameByType } from "~/lib/helpers/searchableNames";
import SearchBar from "~/app/_components/inputs/search/SearchBar";
import type {
  ProjectActivityDetail,
  WithId,
  WithProjectId,
} from "~/lib/types/firebaseSchemas";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/helpers/utils";
import NoActivityIcon from "@mui/icons-material/FormatListBulleted";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import ActivityCard from "~/app/_components/cards/ActivityCard";

interface Props {
  className?: ClassNameValue;
}

const ActivityProjectDashboard = ({ className }: Props) => {
  const { data: users, isLoading: usersLoading } =
    api.users.getGlobalUsers.useQuery({});
  const { data: projects, isLoading: projectsLoading } =
    api.projects.listProjects.useQuery();
  const { data: activities, isLoading: activitiesLoading } =
    api.projects.getActivityDetailsFromTopProjects.useQuery();

  const [searchText, setSearchText] = useState("");

  // scrumId cannot be calculated with hooks as it needs the projectId beforehand
  const getScrumId = (item: WithProjectId<WithId<ProjectActivityDetail>>) => {
    return item.type + item.scrumId.toString();
  };

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
    const typeLabel = getSearchableNameByType(item.type) ?? "";

    // Get user information if available
    const user = item.userId ? userMap[item.userId] : undefined;
    const userName = user
      ? (user.displayName ?? user.email ?? user.id ?? "")
      : (item.userId ?? "System");

    // Get project information if available
    const project = item.projectId ? projectMap[item.projectId] : undefined;
    const projectName = project ? project.name : "Unknown Project";

    const itemTitle = item.name;
    const scrumId = getScrumId(item);

    // Check if any field contains the search text
    return (
      dateStr.toLowerCase().includes(searchLowerCase) ||
      actionStr.toLowerCase().includes(searchLowerCase) ||
      typeStr.toLowerCase().includes(searchLowerCase) ||
      typeLabel.toLowerCase().includes(searchLowerCase) ||
      userName.toLowerCase().includes(searchLowerCase) ||
      projectName.toLowerCase().includes(searchLowerCase) ||
      itemTitle.toLowerCase().includes(searchLowerCase) ||
      scrumId.toString().toLowerCase().includes(searchLowerCase)
    );
  });

  const isLoading: boolean =
    activitiesLoading || usersLoading || projectsLoading;

  return (
    <div
      className={cn(
        "flex h-[39vh] max-h-[580px] flex-col overflow-hidden rounded-lg border-2 border-[#BECAD4] p-5",
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
            const project = item.projectId
              ? projectMap[item.projectId]
              : undefined;
            const itemTitle = item.name;
            const scrumId = getScrumId(item);
            if (!itemTitle && !scrumId) return null;

            return (
              <div key={item.id}>
                <ActivityCard
                  item={item}
                  key={item.id}
                  formattedScrumId={scrumId}
                  user={user}
                  project={project}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityProjectDashboard;
