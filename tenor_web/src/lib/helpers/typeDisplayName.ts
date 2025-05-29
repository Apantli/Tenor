export const TYPE_COLLECTION_MAP: Record<string, string> = {
  "TS": "tasks",
  "IS": "issues",
  "US": "userStories",
  "EP": "epics",
  "SP": "sprints",
  "PJ": "projects"
};

export const getTypeDisplayName = (
  type: string | undefined, 
  format: 'display' | 'search' | 'short' = 'display'
): string => {
  if (!type) return "";
  
  // Normalize the type to uppercase
  const normalizedType = type.toUpperCase();
  
  // Return the appropriate display name based on format
  switch (normalizedType) {
    case "TS": 
      return format === 'search' ? "task" : 
             format === 'short' ? "TS" : "Task";
      
    case "IS": 
      return format === 'search' ? "issue" : 
             format === 'short' ? "IS" : "Issue";
      
    case "EP": 
      return format === 'search' ? "epic" : 
             format === 'short' ? "EP" : "Epic";
      
    case "SP": 
      return format === 'search' ? "sprint" : 
             format === 'short' ? "SP" : "Sprint";
      
    case "US": 
      return format === 'search' ? "user story" : 
             format === 'short' ? "US" : "User Story";
      
    case "PJ": 
      return format === 'search' ? "project" : 
             format === 'short' ? "PJ" : "Project";
      
    default: 
      return type;
  }
};

export const getCollectionNameForType = (
  type: string, 
  defaultCollection: string
): string => {
  if (!type) return defaultCollection;
  const normalizedType = type.toUpperCase();
  return TYPE_COLLECTION_MAP[normalizedType] ?? defaultCollection;
};
