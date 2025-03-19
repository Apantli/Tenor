"use client";

import { useState, useEffect } from "react";
import { auth } from "~/utils/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import { api } from "~/trpc/react";

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
