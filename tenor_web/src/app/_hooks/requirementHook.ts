

export const UseFormatForAssignReqTypeScrumId = (reqType: string, scrumId: number) => {
  // Takes the first letter of each word, uppercases it, and adds the scrumId
  const prefix = reqType
    .split(" ")
    .filter(word => word.length > 0)
    .map(word => word[0]?.toUpperCase())
    .join("");

  return `${prefix}${String(scrumId).padStart(2, "0")}`;
};
