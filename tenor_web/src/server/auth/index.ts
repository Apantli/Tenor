import { cookies } from "next/headers";
import { firebaseAdmin } from "~/lib/db/firebaseAdmin";
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
    if (typeof error === "object" && error != null && "code" in error) {
      console.log("Token verification failed: ", error.code);
    }
    return null;
  }
}

export const auth = cache(uncachedAuth);
