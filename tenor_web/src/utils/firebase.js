// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  connectDataConnectEmulator,
  getDataConnect,
} from "firebase/data-connect";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  DocumentReference,
  query,
  where,
} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.AUTH_FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
  measurementId: env.FIREBASE_MEASUREMENT_ID,
};
import { connectorConfig } from "@firebasegen/tenor-muse";
import { env } from "~/env";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dataConnect = getDataConnect(app, connectorConfig);
connectDataConnectEmulator(dataConnect, "localhost", 9399);

export { db, app, dataConnect };
