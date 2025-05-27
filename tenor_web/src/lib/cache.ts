import type {
  Productivity,
  ProjectStatusCache,
} from "~/lib/types/firebaseSchemas";

export const shouldRecomputeProductivity = ({
  data,
  time,
  refreshHours = 24,
}: {
  data: Productivity | undefined;
  time: string;
  refreshHours?: number;
}) => {
  if (!data) return true;

  const cacheTarget = data.cached.find((cached) => cached.time === time);
  if (!cacheTarget) return true;

  const currentTime = new Date();
  const lastFetchDate = cacheTarget.fetchDate.toDate();
  const timeDifference = currentTime.getTime() - lastFetchDate.getTime();

  // Hours to milliseconds
  const refreshTime = refreshHours * 60 * 60 * 1000;

  return timeDifference > refreshTime;
};

export const shouldRecomputeTopProjects = ({
  cacheTarget,
  refreshHours = 24,
}: {
  cacheTarget: ProjectStatusCache | undefined;
  refreshHours?: number;
}) => {
  if (!cacheTarget) return true;

  const currentTime = new Date();
  const lastFetchDate = cacheTarget.fetchDate.toDate();
  const timeDifference = currentTime.getTime() - lastFetchDate.getTime();

  // Hours to milliseconds
  const refreshTime = refreshHours * 60 * 60 * 1000;

  return timeDifference > refreshTime;
};
