import type { AnyBacklogItemType } from "../types/firebaseSchemas";

/**
 * @function sortByItemTypeAndScrumId
 * @description Creates a comparator function that sorts items first by card type (US, IS, IT) and then by scrum ID in ascending order.
 * @param {Record<string, { scrumId: number; cardType: AnyBacklogItemType; }>} items - A record of items keyed by string identifiers, containing scrumId and cardType properties.
 * @returns {(a: string, b: string) => number} - A comparator function that takes two string keys and returns a number for sorting.
 */
export const sortByItemTypeAndScrumId = (
  items: Record<
    string,
    {
      scrumId: number;
      itemType: AnyBacklogItemType;
    }
  >,
) => {
  return (a: string, b: string) => {
    const itemA = items[a];
    const itemB = items[b];
    if (itemA?.itemType === itemB?.itemType) {
      return (itemA?.scrumId ?? 0) - (itemB?.scrumId ?? 0);
    }
    const typeOrder: Record<AnyBacklogItemType, number> = {
      US: 0,
      IS: 1,
      IT: 2,
    };
    return (
      typeOrder[itemA?.itemType ?? "IT"] - typeOrder[itemB?.itemType ?? "IT"]
    );
  };
};

/**
 * @function sortByCardTypeAndScrumId
 * @description Creates a comparator function that sorts items first by card type (US, IS, IT) and then by scrum ID in ascending order by mapping cardType to itemType and delegating to sortByItemTypeAndScrumId.
 * @param {Record<string, { scrumId: number; cardType: AnyBacklogItemType; }>} items - A record of items keyed by string identifiers, containing scrumId and cardType properties.
 * @returns {(a: string, b: string) => number} - A comparator function that takes two string keys and returns a number for sorting.
 */
export const sortByCardTypeAndScrumId = (
  items: Record<
    string,
    {
      scrumId: number;
      cardType: AnyBacklogItemType;
    }
  >,
) => {
  // Map items to use itemType property to reuse existing function
  const mappedItems: Record<
    string,
    { scrumId: number; itemType: AnyBacklogItemType }
  > = {};
  Object.keys(items).forEach((key) => {
    const item = items[key];
    if (item) {
      mappedItems[key] = {
        scrumId: item.scrumId,
        itemType: item.cardType,
      };
    }
  });

  return sortByItemTypeAndScrumId(mappedItems);
};
