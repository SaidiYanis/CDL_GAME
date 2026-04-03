import type { FirebaseOptions } from "firebase/app";
import { env } from "@/src/config/env";

export const firebaseConfig: FirebaseOptions = {
  apiKey: env.firebase.apiKey,
  appId: env.firebase.appId,
  authDomain: env.firebase.authDomain,
  measurementId: env.firebase.measurementId,
  messagingSenderId: env.firebase.messagingSenderId,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
};
