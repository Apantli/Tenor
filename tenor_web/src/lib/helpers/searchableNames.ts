import type { AllBasicItemType } from "../types/firebaseSchemas";

/**
 * @function getSearchableNameByType
 * @description Converts an item type to a searchable string containing various type aliases for better search functionality
 * @param itemType The type of item, based on AllBasicItemType
 * @returns {string} A space-separated string of searchable type names and aliases
 */
export const getSearchableNameByType = (itemType: AllBasicItemType) => {
  switch (itemType) {
    case "US":
      return "Type:US Type:Story Type:UserStory Type:User Story";
    case "IS":
      return "Type:IS Type:Issue Type:Bug";
    case "IT":
      return "Type:IT Type:Item Type:BacklogItem Type:Backlog Item Type:Generic Backlog Item Type:Generic Item";
    case "TS":
      return "Type:TS Type:Task";
    case "EP":
      return "Type:EP Type:Epic";
    case "PJ":
      return "Type:PJ Type:Project Type:Project Activity";
    case "SP":
      return "Type:SP Type:Sprint";
    case "RE":
      return "Type:RE Type:Requirement Type:Requirement Activity";
  }
};
