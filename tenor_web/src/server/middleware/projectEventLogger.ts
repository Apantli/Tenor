import type { Firestore } from "firebase-admin/firestore";

type ActivityType = "US" | "EP" | "IS" | "TS" | "SP";
type ActionType = "create" | "update" | "delete";

interface LogProjectActivityParams {
  firestore: Firestore;
  projectId: string;
  itemId: string;
  userId: string;
  type: ActivityType;
  action: ActionType;
}

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
}