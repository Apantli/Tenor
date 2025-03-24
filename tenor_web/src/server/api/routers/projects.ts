import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

interface User {
  uid: string;
  projectIds: string[];
}

interface Project {
  id: string;
  name: string;
  link: string;
  description: string;
  delete: boolean;
}


const fetchProjectData = async (projectRef: FirebaseFirestore.DocumentReference, dbAdmin: FirebaseFirestore.Firestore): Promise<Project | null> => {
  try {
    console.log('Fetching project data for', projectRef.path);
    const projectSnapshot = await dbAdmin.doc(projectRef.path).get(); // Use adminDb.doc

    if (projectSnapshot.exists) {
      return { id: projectSnapshot.id, ...projectSnapshot.data() } as Project;
    }
  } catch (error) {
    console.error('Error getting documents: ', error);
  }

  return null;
};

const fetchUserProjects = async (uid: string, dbAdmin: FirebaseFirestore.Firestore) => {
  try {
    // Buscar usuario en Firestore por su uid
    const usersCollection = dbAdmin.collection('users'); // Use dbAdmin.collection
    const querySnapshot = await usersCollection.where('uid', '==', uid).get(); // Use dbAdmin.collection.where

    if (querySnapshot.empty) {
      console.log('No matching documents.');
      return [];
    }

    const userData = querySnapshot.docs[0]?.data() as User;
    console.log('User data from Firestore:', userData);

    if (!userData.projectIds || userData.projectIds.length === 0) {
      console.log('No projects assigned for user', uid);
      return [];
    }

    console.log('Project references (string) for user:', userData.projectIds);

    // Transform the string to a DocumentReference
    const assignProjectRefs = userData.projectIds.map((projectPath) =>
      dbAdmin.doc(`projects/${projectPath}`) // Use dbAdmin.doc
    );

    console.log('Converted project references:', assignProjectRefs);

    const projectResults = await Promise.all(
      assignProjectRefs.map((projectRef) => fetchProjectData(projectRef, dbAdmin))
    );

    const projects: Project[] = projectResults.filter(
      (project): project is Project => project !== null
    );

    if (projects.length === 0) {
      console.log('No projects found for user', uid);
    } else {
      console.log('Projects found for user', uid, projects);
    }

    return projects;
  } catch (error) {
    console.error('Error getting documents: ', error);
    return [];
  }
};

export const projectsRouter = createTRPCRouter({
  listProjects: protectedProcedure.query(async ({ctx}) => {
    const useruid = ctx.session.user.uid ?? "";

    return await fetchUserProjects(useruid, ctx.firestore);
  })
});
