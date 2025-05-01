import { type Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import {
  ProjectSchema,
  SettingsSchema,
  TagSchema,
} from "~/lib/types/zodFirebaseSchema";
import { getProjectSettingsRef } from "~/server/api/routers/settings";

export const getProjectContextHeader = async (
  projectId: string,
  firestore: Firestore,
) => {
  const projectDoc = await firestore
    .collection("projects")
    .doc(projectId)
    .get();
  const projectData = ProjectSchema.parse(projectDoc.data());

  const aiContextDoc = await getProjectSettingsRef(projectId, firestore).get();
  const aiContext = SettingsSchema.parse(aiContextDoc.data()).aiContext;

  return `
The following is some context for a software project that is being developed. Your job is to help the user organize their project in different ways. Read the following context and then answer the required question.

###### BEGINNING OF PROJECT CONTEXT

# PROJECT NAME
${projectData.name}

# PROJECT DESCRIPTION
${projectData.description}

# TEXTUAL CONTEXT
${aiContext.text}

## THE FOLLOWING ARE SOME FILES THE USER HAS UPLOADED TO IMPROVE YOUR UNDERSTANDING

${aiContext.files.map((file) => `# FILE: ${file.name}\n\n${file.content}`).join("\n\n")}

## THE FOLLOWING ARE SOME WEBSITES THE USER HAS UPLOADED TO IMPROVE YOUR UNDERSTANDING

${aiContext.links.map((link) => `# LINK: ${link.link}\n\n${link.content}`).join("\n\n")}

###### END OF PROJECT CONTEXT
  `;
};

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
