import type { LogProjectActivityParams } from "~/lib/types/firebaseSchemas";

export const LogProjectActivity = async ({
  firestore,
  projectId,
  itemId,
  userId,
  type,
  action,
}: LogProjectActivityParams) => {
  try {
    const activeRef = firestore
      .collection("projects")
      .doc(projectId)
      .collection("activity");

    await activeRef.add({
      itemId,
      userId,
      type,
      date: new Date(),
      action,
    });
  } catch (error) {
    console.error("Error logging project activity:", error);
    throw new Error("Failed to log project activity");
  }
};
