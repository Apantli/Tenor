"use client";
import { ProductivityCard } from "~/app/_components/cards/ProductivityCard";

export default function ProjectPerformance() {
  const issuesData = {
    completed: 75,
    total: 100,
  };
  const userStoriesData = {
    completed: 200,
    total: 200,
  };

  return (
    <div>
      <ProductivityCard
        issues={issuesData}
        lastUpdated="Today"
        sprint={4}
        userStories={userStoriesData}
      />
    </div>
  );
}
