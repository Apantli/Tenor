"use client";
import { api } from "~/trpc/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useFormatAnyScrumId } from "../_hooks/scrumIdHooks";
import SearchBar from "./inputs/search/SearchBar";
import { getSearchableNameByType } from "~/lib/helpers/searchableNames";
import { cn } from "~/lib/helpers/utils";
import type { ClassNameValue } from "tailwind-merge";
import NoActivityIcon from "@mui/icons-material/FormatListBulleted";
import LoadingSpinner from "./LoadingSpinner";
import ActivityCard from "./cards/ActivityCard";
import type { WithId, ProjectActivityDetail, ProjectActivity } from "~/lib/types/firebaseSchemas";

interface Props {
  projectId: string;
  className?: ClassNameValue;
}

// Child component that handles pagination
const ActivityList = ({ 
  projectId, 
  searchText, 
  formatAnyScrumId, 
  userMap 
}: { 
  projectId: string; 
  searchText: string;
  formatAnyScrumId: (scrumId: number, type?: any) => string;
  userMap: Record<string, any>;
}) => {
  const [allActivities, setAllActivities] = useState<WithId<ProjectActivityDetail>[]>([]);
  const [lastCursor, setLastCursor] = useState<WithId<ProjectActivity> | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Initial data query
  const { data: activitiesData, isLoading } = api.projects.getActivityDetails.useQuery({ 
    projectId,
    limit: 10
  });

  // Set initial data
  useEffect(() => {
    if (activitiesData?.results) {
      setAllActivities(activitiesData.results);
      setLastCursor(activitiesData.lastCursor);
      setHasMore(activitiesData.hasMore);
    }
  }, [activitiesData]);

  // Load more data query (different endpoint)
  const { refetch: fetchMoreActivities } = api.projects.getMoreActivityDetails.useQuery(
    { 
      projectId,
      cursorId: lastCursor?.id,
      limit: 10
    },
    { enabled: false } // Don't run automatically
  );

  // Function to load more
  const loadMoreActivities = useCallback(async () => {
    if (!hasMore || isFetchingNextPage) return;
    
    setIsFetchingNextPage(true);
    
    try {
      const { data } = await fetchMoreActivities();
      
      if (data?.results && data.results.length > 0) {
        setAllActivities(prev => [...prev, ...data.results]);
        setLastCursor(data.lastCursor);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more activities:", error);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [fetchMoreActivities, hasMore, isFetchingNextPage]);

  // Setup intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading && !isFetchingNextPage) {
          void loadMoreActivities();
        }
      },
      { threshold: 0.1 }
    );
    
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, isFetchingNextPage, loadMoreActivities]);

  // Filter activities based on search
  const filteredActivities = allActivities?.filter((item) => {
    if (!searchText) return true;

    const searchLowerCase = searchText.toLowerCase();

    // Prepare all searchable fields
    const dateStr = item.date ? String(item.date) : "";
    const actionStr = item.action ?? "";
    const typeStr = item.type ?? "";
    const typeLabel = getSearchableNameByType(item.type) ?? "";
    
    const user = item.userId ? userMap[item.userId] : undefined;
    const userName = user
      ? (user.displayName ?? user.email ?? user.id ?? "")
      : (item.userId ?? "System");

    const itemTitle = item.name;
    const scrumId = formatAnyScrumId(item.scrumId ?? 0, item.type);

    return (
      dateStr.toLowerCase().includes(searchLowerCase) ||
      actionStr.toLowerCase().includes(searchLowerCase) ||
      typeStr.toLowerCase().includes(searchLowerCase) ||
      typeLabel.toLowerCase().includes(searchLowerCase) ||
      userName.toLowerCase().includes(searchLowerCase) ||
      itemTitle?.toLowerCase().includes(searchLowerCase) ||
      scrumId.toString().toLowerCase().includes(searchLowerCase)
    );
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  if (!allActivities || allActivities.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <span className="text-[100px] text-gray-500">
          <NoActivityIcon fontSize="inherit" />
        </span>
        <h1 className="mb-5 text-2xl font-semibold text-gray-500">
          No activity yet
        </h1>
      </div>
    );
  }

  return (
    <>
      {filteredActivities?.map((item) => {
        const user = item.userId ? userMap[item.userId] : undefined;
        const itemTitle = item.name;
        const scrumId = formatAnyScrumId(item.scrumId ?? 0, item.type);
        if (!itemTitle && !scrumId) return null;

        return (
          <div key={item.id}>
            <ActivityCard
              item={item}
              key={item.id}
              formattedScrumId={scrumId}
              user={user}
            />
          </div>
        );
      })}
      
      {/* Observer target element for infinite scrolling */}
      {hasMore && (
        <div 
          ref={observerTarget} 
          className="py-2 flex justify-center"
        >
          {isFetchingNextPage && <LoadingSpinner color="primary" />}
        </div>
      )}
    </>
  );
};

// Main component - simplified with pagination logic moved to child component
const ActivityProjectOverview = ({ projectId, className }: Props) => {
  const { data: users, isLoading: usersLoading } = api.users.getUsers.useQuery({
    projectId,
  });
  
  const [searchText, setSearchText] = useState("");
  const formatAnyScrumId = useFormatAnyScrumId(projectId);

  // Create user map
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
      
      {usersLoading ? (
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ActivityList
            projectId={projectId}
            searchText={searchText}
            formatAnyScrumId={formatAnyScrumId}
            userMap={userMap}
          />
        </div>
      )}
    </div>
  );
};

export default ActivityProjectOverview;
