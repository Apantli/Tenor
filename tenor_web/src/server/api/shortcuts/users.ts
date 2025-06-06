import type { Firestore } from "firebase-admin/firestore";
import type * as admin from "firebase-admin";
import type { UserPreview } from "~/lib/types/detailSchemas";
import type { WithId } from "~/lib/types/firebaseSchemas";
import { getProjectRef } from "./general";
import type { UserCol } from "~/lib/types/columnTypes";
import { notFound } from "~/server/errors";

/**
 * @function getGlobalUsersRef
 * @description Gets a reference to a specific user document
 * @param firestore A Firestore instance
 * @returns {FirebaseFirestore.DocumentReference} A reference to the user document
 */
export const getGlobalUsersRef = (firestore: Firestore) => {
  return firestore.collection("users");
};

/**
 * @function getGlobalUserRef
 * @description Gets a reference to a specific user document
 * @param firestore A Firestore instance
 * @param userId The ID of the user
 * @returns {FirebaseFirestore.DocumentReference} A reference to the user document
 */
export const getGlobalUserRef = (firestore: Firestore, userId: string) => {
  return getGlobalUsersRef(firestore).doc(userId);
};

/**
 * @function getGlobalUserPreviews
 * @description Retrieves a list of user previews from Firebase Auth
 * @param admin A Firebase Admin instance
 * @returns {Promise<UserPreview[]>} An array of user preview objects
 */
export const getGlobalUserPreviews = async (admin: admin.app.App) => {
  const users = await admin.auth().listUsers(1000);

  const usersList: WithId<UserPreview>[] = users.users.map((user) => ({
    id: user.uid,
    displayName: user.displayName ?? user.email ?? "NA",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
  }));

  return usersList;
};

/**
 * @function getGlobalUserPreview
 * @description Retrieves a user preview from Firebase Auth
 * @param admin A Firebase Admin instance
 * @param userId The ID of the user
 * @returns {Promise<UserPreview | undefined>} A user preview object or undefined if not found
 */
export const getGlobalUserPreview = async (
  admin: admin.app.App,
  userId: string,
): Promise<WithId<UserPreview> | undefined> => {
  const user = await admin.auth().getUser(userId);
  if (!user) {
    throw notFound("User");
  }
  const userPreview: WithId<UserPreview> = {
    id: user.uid,
    displayName: user.displayName ?? user.email ?? "NA",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
  };
  return userPreview;
};

/**
 * @function getUsersRef
 * @description Gets a reference to the users collection
 * @param firestore A Firestore instance
 * @returns {FirebaseFirestore.CollectionReference} A reference to the users collection
 */
export const getUsersRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("users");
};

/**
 * @function getUserRef
 * @description Gets a reference to a specific user document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param userId The ID of the user
 * @returns {FirebaseFirestore.DocumentReference} A reference to the user document
 */
export const getUserRef = (
  firestore: Firestore,
  projectId: string,
  userId: string,
) => {
  return getUsersRef(firestore, projectId).doc(userId);
};

/**
 * @function getUsers
 * @description Retrieves all non-deleted users associated with a specific project
 * @param admin A Firebase Admin instance
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<WithId<User>[]>} An array of user objects with their IDs
 */
export const getUsers = async (
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
) => {
  const usersSnapshot = await getUsersRef(firestore, projectId)
    .where("active", "==", true)
    .get();

  const users: WithId<UserPreview>[] = await Promise.all(
    usersSnapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      const firebaseUser = await admin.auth().getUser(userId);
      return {
        id: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? firebaseUser.email ?? "NA",
        email: firebaseUser.email ?? "",
        photoURL: firebaseUser.photoURL ?? "",
      } as WithId<UserPreview>;
    }),
  );
  return users;
};

/**
 * @function getUser
 * @description Retrieves a specific user from the Firestore database
 * @param admin A Firebase Admin instance
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param userId The ID of the user
 * @returns {Promise<WithId<User>>} The user object validated by UserSchema or undefined if not found
 */
export const getUser = async (
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
  userId: string,
) => {
  const userRef = getUserRef(firestore, projectId, userId);
  const userSnapshot = await userRef.get();
  if (!userSnapshot.exists) {
    throw notFound("User");
  }
  const firebaseUser = await admin.auth().getUser(userId);
  return {
    id: userSnapshot.id,
    displayName: firebaseUser.displayName ?? firebaseUser.email ?? "NA",
    email: firebaseUser.email ?? "",
    photoURL: firebaseUser.photoURL ?? "",
  } as WithId<UserPreview>;
};

/**
 * @function getUserTable
 * @description Retrieves all users associated with a specific project and their details
 * @param admin A Firebase Admin instance
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<UserCol[]>} An array of user objects with their IDs and details
 */
export const getUserTable = async (
  admin: admin.app.App,
  firestore: Firestore,
  projectId: string,
) => {
  const usersSnapshot = await getUsersRef(firestore, projectId)
    .where("active", "==", true)
    .get();
  const userTable: UserCol[] = await Promise.all(
    usersSnapshot.docs.map(async (userDoc) => {
      const user = await admin.auth().getUser(userDoc.id);
      const userCol: UserCol = {
        id: userDoc.id,
        displayName: user.displayName ?? "",
        email: user.email ?? "",
        photoURL: user.photoURL ?? "",
        roleId: userDoc.data().roleId as string,
      };
      return userCol;
    }),
  );
  return userTable;
};
