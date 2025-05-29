import admin, { type ServiceAccount } from "firebase-admin";
import { env } from "~/env";

if (!admin.apps.length) {
  try {
    const serviceAccountKey = JSON.parse(
      env.FIREBASE_SERVICE_ACCOUNT_KEY,
    ) as ServiceAccount;

    const appConfig: admin.AppOptions = {
      credential: admin.credential.cert(serviceAccountKey),
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    };

    // Configure emulator usage in development environment
    if (
      process.env.NEXT_PUBLIC_ENVIRONMENT === "development" &&
      env.FIREBASE_EMULATOR_IP
    ) {
      console.log("Using Firebase emulators");
      process.env.FIRESTORE_EMULATOR_HOST = `${env.FIREBASE_EMULATOR_IP}:8080`;
      process.env.FIREBASE_AUTH_EMULATOR_HOST = `${env.FIREBASE_EMULATOR_IP}:9099`;
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${env.FIREBASE_EMULATOR_IP}:9199`;
    }

    admin.initializeApp(appConfig);

    admin.firestore().settings({
      ignoreUndefinedProperties: true,
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export const firebaseAdmin = admin;
export const dbAdmin = admin.firestore();
export const storageAdmin = admin.storage();
