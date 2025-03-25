import { Project } from "~/lib/types/firebaseSchemas";


export const createEmptyProject = (): Project => {
  return {
    name: "",
    description: "",
    logoUrl: "",
    deleted: false,
    
    settings: {} as any, // Deberías definir un `emptySettings` si `Settings` tiene valores requeridos

    users: [],

    requirements: [],
    userStories: [],
    issues: [],
    epics: [],
    genericItems: [],

    sprints: [],
    sprintSnapshots: [],
    currentSprintId: "",

    activities: [],
  };
};

const createProject = async (project: Project, dbAdmin: FirebaseFirestore.Firestore, onSuccess?: (projectId: string)=> void )=> {
  try {
    const projectRef = await dbAdmin.collection('projects').add(project);
    console.log('Project added with ID: ', projectRef.id);

    if (onSuccess) {
      onSuccess(projectRef.id);
    }

    return projectRef.id;
  } catch (error) {
    console.error('Error adding document: ', error);
    return null;
  }
}

export default createProject;