import { Firestore } from "firebase-admin/firestore";
import {
  ProjectSchema,
  SettingsSchema,
  TagSchema,
} from "~/lib/types/zodFirebaseSchema";
import {
  getProject,
  getProjectRef,
  getSettings,
  getSettingsRef,
} from "./general";

export const getProjectContext = async (
  firestore: Firestore,
  projectId: string,
) => {
  const project = await getProject(firestore, projectId);
  const aiContext = (await getSettings(firestore, projectId)).aiContext;

  return `
  The following is some context for a software project that is being developed. Your job is to help the user organize their project in different ways. Read the following context and then answer the required question.
  
  ###### BEGINNING OF PROJECT CONTEXT
  
  # PROJECT NAME
  ${project.name}
  
  # PROJECT DESCRIPTION
  ${project.description}
  
  # TEXTUAL CONTEXT
  ${aiContext.text}
  
  ## THE FOLLOWING ARE SOME FILES THE USER HAS UPLOADED TO IMPROVE YOUR UNDERSTANDING
  
  ${aiContext.files.map((file) => `# FILE: ${file.name}\n\n${file.content}`).join("\n\n")}
  
  ## THE FOLLOWING ARE SOME WEBSITES THE USER HAS UPLOADED TO IMPROVE YOUR UNDERSTANDING
  
  ${aiContext.links.map((link) => `# LINK: ${link.link}\n\n${link.content}`).join("\n\n")}
  
  ###### END OF PROJECT CONTEXT
    `;
};
