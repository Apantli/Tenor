import {
  collection,
  getDocs,
  query,
  where,
  type DocumentReference,
  getDoc,
  doc,
  type Firestore,
} from "firebase/firestore";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

interface User {
  email: string;
  assign_projects: string[];
}

interface Project {
  id: string;
  project_name: string;
  link: string;
  description: string;
}


const fetchProjectData = async (
  projectRef: DocumentReference,
): Promise<Project | null> => {
  try {
    console.log("Fetching project data for", projectRef.path);
    const projectSnapshot = await getDoc(projectRef);
    if (projectSnapshot.exists()) {
      return { id: projectSnapshot.id, ...projectSnapshot.data() } as Project;
    }
  } catch (error) {
    console.error("Error getting documents: ", error);
  }

  return null;
};

const fetchUserProjects = async (email: string, db: Firestore) : Promise<Project[]> => {
  try {
    //Buscar usuario en Firestore por su email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No matching documents.");
      return [];
    }

    const userData = querySnapshot.docs[0]?.data() as User;
    console.log("User data from Firestore:", userData);

    if (!userData.assign_projects || userData.assign_projects.length === 0) {
      console.log("No projects assigned for user", email);
      return [];
    }

    console.log("Project references (string) for user:", userData.assign_projects);


    // Transform the string to a DocumentReference
    const assignProjectRefs = userData.assign_projects.map((projectPath) =>
      doc(db, projectPath)
    );

    console.log("Converted project references:", assignProjectRefs);

    const projectResults = await Promise.all(
      assignProjectRefs.map((projectRef) => fetchProjectData(projectRef))
    );

    const projects: Project[] = projectResults.filter((project): project is Project => project !== null);

    if (projects.length === 0) {
      console.log("No projects found for user", email);
    } else {
      console.log("Projects found for user", email, projects);
    }

    return projects;
  } catch (error) {
    console.error("Error getting documents: ", error);
    return [];
  }
};

export const projectsRouter = createTRPCRouter({
  listProjects: protectedProcedure.query(async ({ctx}) => {
    const userEmail = ctx.session.user.email ?? "";

    console.log(userEmail);

    return await fetchUserProjects(userEmail, ctx.firestore);
  })
});
