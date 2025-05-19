import type { Firestore } from "firebase-admin/firestore";
import type { Role, Size, WithId } from "~/lib/types/firebaseSchemas";
import { ProjectSchema, SettingsSchema } from "~/lib/types/zodFirebaseSchema";
import { getPriority } from "./tags";
import { getProjectContext } from "./ai";

/**
 * @function getProjectsRef
 * @description Gets a reference to the projects collection
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.CollectionReference} A reference to the projects collection
 */
export const getProjectsRef = (firestore: Firestore) => {
  return firestore.collection("projects");
};

/**
 * @function getProjectRef
 * @description Gets a reference to the project document
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @returns {FirebaseFirestore.DocumentReference} A reference to the project document
 */
export const getProjectRef = (firestore: Firestore, projectId: string) => {
  return getProjectsRef(firestore).doc(projectId);
};

/**
 * @function getProject
 * @description Retrieves the project document
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @returns {Promise<WithId<Project>>} A promise that resolves to the project document
 */
export const getProject = async (firestore: Firestore, projectId: string) => {
  const project = await getProjectRef(firestore, projectId).get();
  if (!project.exists) {
    throw new Error("Project not found");
  }
  return { id: project.id, ...ProjectSchema.parse(project.data()) };
};

/**
 * @function getSettingsRef
 * @description Gets a reference to the project settings document
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.DocumentReference} A reference to the project settings document
 */
export const getSettingsRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId)
    .collection("settings")
    .doc("settings");
};

/**
 * @function getSettings
 * @description Retrieves the settings for a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 */
export const getSettings = async (firestore: Firestore, projectId: string) => {
  const settings = await getSettingsRef(firestore, projectId).get();
  return SettingsSchema.parse(settings.data());
};

/**
 * @function getRolesRef
 * @description Gets a reference to the project roles collection
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.CollectionReference} A reference to the project roles collection
 */
export const getRolesRef = (firestore: Firestore, projectId: string) => {
  return getSettingsRef(firestore, projectId).collection("userTypes");
};

/**
 * @function getPerformanceRef
 * @description Gets a reference to the project's performance subcollection
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.CollectionReference} A reference to the performance subcollection
 */
export const getPerformanceRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("performance");
};

export const getProductivityRef = (firestore: Firestore, projectId: string) => {
  return getPerformanceRef(firestore, projectId).doc("productivity");
};

/**
 * @function getRoleRef
 * @description Gets a reference to a specific project role document
 * @param {string} projectId - The ID of the project
 * @param {string} roleId - The ID of the role
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.DocumentReference} A reference to the project role document
 */
export const getRoleRef = (
  firestore: Firestore,
  projectId: string,
  roleId: string,
) => {
  return getRolesRef(firestore, projectId).doc(roleId);
};

export const getRoles = async (firestore: Firestore, projectId: string) => {
  const rolesRef = getRolesRef(firestore, projectId);
  const rolesSnapshot = await rolesRef.get();
  const roles: WithId<Role>[] = rolesSnapshot.docs.map((roleData) => {
    return {
      id: roleData.id,
      ...roleData.data(),
    } as WithId<Role>;
  });
  return roles;
};

export const getGenericBacklogItemContext = async (
  firestore: Firestore,
  projectId: string,
  name: string,
  description: string,
  priorityId?: string,
  size?: Size,
) => {
  const priority = priorityId
    ? await getPriority(firestore, projectId, priorityId)
    : undefined;
  const priorityContext = priority ? `- priority: ${priority.name}\n` : "";
  const sizeContext = size ? `- size: ${size}\n` : "";

  return `- name: ${name}\n- description: ${description}\n${priorityContext}${sizeContext}\n\n`;
};

export const generateTaskContext = async (
  firestore: Firestore,
  projectId: string,
  itemContext: string,
  itemTypeName: string,
  tasksContext: string,
  amount: number,
  prompt: string,
) => {
  const passedInPrompt =
    prompt != ""
      ? `Consider that the user wants the tasks for the following: ${prompt}`
      : "";

  const completePrompt = `
  ${await getProjectContext(firestore, projectId)}
  
  Given the following context, follow the instructions below to the best of your ability.
  
  ${itemContext}
  ${tasksContext}
  
  Generate ${amount} tasks about the detailed ${itemTypeName}. You can also see the tasks that already exist, DO NOT repeat tasks. Do NOT include any identifier in the name like "Task 1", just use a normal title. Always include a size.\n\n
  
  ${passedInPrompt}
            `;
  return completePrompt;
};
