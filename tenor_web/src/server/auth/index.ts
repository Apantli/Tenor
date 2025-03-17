import { cookies } from "next/headers";
import { firebaseAdmin } from "~/utils/firebaseAdmin";
import { cache } from "react";

export async function uncachedAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value; // Replace 'token' with your cookie name

  if (!token) {
    return null;
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    const user = await firebaseAdmin.auth().getUser(decodedToken.uid);
    return user;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export const auth = cache(uncachedAuth);
