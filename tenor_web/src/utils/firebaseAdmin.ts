import admin, { type ServiceAccount } from "firebase-admin";
import { env } from "~/env";

if (!admin.apps.length) {
  try {
    const serviceAccountKey = JSON.parse(
      env.FIREBASE_SERVICE_ACCOUNT_KEY,
    ) as ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });

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
