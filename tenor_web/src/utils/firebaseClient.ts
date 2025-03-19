import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.setPersistence(browserLocalPersistence);
auth.settings.appVerificationDisabledForTesting = true;

// if (process.env.NODE_ENV === "test") {
//   connectAuthEmulator(auth, "http://localhost:9099");
// }
