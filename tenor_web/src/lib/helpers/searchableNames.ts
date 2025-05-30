import type { AllBasicItemType } from "../types/firebaseSchemas";

export const itemTypeToSearchableName = (itemType: AllBasicItemType) => {
  switch (itemType) {
    case "US":
      return "Type:Story Type:UserStory Type:User Story";
    case "IS":
      return "Type:Issue Type:Bug";
    case "IT":
      return "Type:Item Type:BacklogItem Type:Backlog Item Type:Generic Backlog Item Type:Generic Item";
    default:
      throw new Error(`Unknown item type: ${itemType}`); // Error for unsupported item types. Add your own if needed.
  }
};
