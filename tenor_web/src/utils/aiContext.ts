import { type Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { TagSchema } from "~/lib/types/zodFirebaseSchema";
import { getProjectSettingsRef } from "~/server/api/routers/settings";

export const collectTagContext = async (
  title: string,
  collectionName: string,
  projectId: string,
  firestore: Firestore,
) => {
  const settingsRef = getProjectSettingsRef(projectId, firestore);
  const tags = await settingsRef
    .collection(collectionName)
    .where("deleted", "==", false)
    .get();

  let context = `# ${title.toUpperCase()}\n\n`;
  tags.forEach((tag) => {
    const tagData = TagSchema.parse(tag.data());
    context += `- id: ${tag.id}\n- name: ${tagData.name}\n\n`;
  });

  return context;
};

export const collectPriorityTagContext = async (
  projectId: string,
  firestore: Firestore,
) => {
  return await collectTagContext(
    "PRIORITY TAGS",
    "priorityTypes",
    projectId,
    firestore,
  );
};

export const collectBacklogTagsContext = async (
  projectId: string,
  firestore: Firestore,
) => {
  return await collectTagContext(
    "BACKLOG TAGS",
    "backlogTags",
    projectId,
    firestore,
  );
};

export const ContextObjectSchema = z.record(z.string(), z.any());
export type ContextObject = z.infer<typeof ContextObjectSchema>;

export const parseContext = ({
  contextObject,
  removeEmpty = true,
}: {
  contextObject: ContextObject;
  removeEmpty?: boolean;
}) => {
  let objectEntries = Object.entries(contextObject);
  if (removeEmpty)
    objectEntries = objectEntries.filter(([_, value]) => value !== null);

  return objectEntries
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
};
