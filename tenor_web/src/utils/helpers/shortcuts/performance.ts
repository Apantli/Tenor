import { Firestore } from "firebase-admin/firestore";
import { getProjectRef } from "./general";

export const getActivityRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("activity");
}