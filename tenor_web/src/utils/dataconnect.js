import { initializeApp } from "firebase/app";
import { connectorConfig } from "@firebasegen/tenor-muse";
import {
  connectDataConnectEmulator,
  getDataConnect,
} from "firebase/data-connect";
import { env } from "~/env";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  projectId: env.AUTH_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);

export const dataConnect = getDataConnect(app, connectorConfig);
connectDataConnectEmulator(dataConnect, "localhost", 9399);

// Make calls from your app
