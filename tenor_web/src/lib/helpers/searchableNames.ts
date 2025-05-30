import type { AnyBacklogItemType } from "../types/firebaseSchemas";

/**
 * @function itemTypeToSearchableName
 * @description Converts a backlog item type to a searchable string containing various type aliases for better search functionality
 * @param itemType The type of backlog item (US for User Story, IS for Issue/Bug, IT for Generic Item)
 * @returns {string} A space-separated string of searchable type names and aliases
 */
export const itemTypeToSearchableName = (itemType: AnyBacklogItemType) => {
  // Only supports backlog items for now, but if needed you can extend the typing and add new cases
  switch (itemType) {
    case "US":
      return "Type:Story Type:UserStory Type:User Story";
    case "IS":
      return "Type:Issue Type:Bug";
    case "IT":
      return "Type:Item Type:BacklogItem Type:Backlog Item Type:Generic Backlog Item Type:Generic Item";
  }
};
