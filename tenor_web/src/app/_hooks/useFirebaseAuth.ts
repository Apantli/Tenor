"use client";

import { useState, useEffect } from "react";
import { auth } from "~/utils/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (authUser) => {
        if (authUser) await authUser?.reload();
        setLoading(false);
        setUser(authUser);
      },
      (error) => {
        console.error("Firebase Auth error:", error);
        setLoading(false); // Set loading to false even on error
      },
    );

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
