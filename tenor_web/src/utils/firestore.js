import { initFirestore } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import { env } from "~/env";

export const firestore = initFirestore({
  credential: cert({
    projectId: env.AUTH_FIREBASE_PROJECT_ID,
    clientEmail: env.AUTH_FIREBASE_CLIENT_EMAIL,
    privateKey: env.AUTH_FIREBASE_PRIVATE_KEY,
  }),
});
