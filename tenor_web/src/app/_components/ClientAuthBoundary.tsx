"use client";

import { type PropsWithChildren, useEffect, useState } from "react";
import { useFirebaseAuth } from "../_hooks/useFirebaseAuth";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { type User } from "firebase/auth";

export default function ClientAuthBoundary({ children }: PropsWithChildren) {
  const { user, loading } = useFirebaseAuth();
  const [refreshed, setRefreshed] = useState(false);
  const router = useRouter();

  const { mutateAsync: refreshSession } = api.auth.refreshSession.useMutation();

  useEffect(() => {
    if (loading) return;

    const checkAndUpdateToken = async (user: User) => {
      await user.reload();
      try {
        const token = await user.getIdToken();
        await refreshSession({ token });
        setRefreshed(true);
      } catch {
        console.log("failed to refresh token");
        router.push("/login");
      }

      if (!user.emailVerified) {
        router.push("/verify-email");
      }
    };

    if (user) {
      void checkAndUpdateToken(user);
    } else {
      router.push("/login");
    }
  }, [user, loading, router, refreshSession]);

  if (loading || !user || !refreshed || !user.emailVerified) {
    return <></>;
  }

  return children;
}
