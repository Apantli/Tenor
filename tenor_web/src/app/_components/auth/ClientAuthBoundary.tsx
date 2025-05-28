"use client";

import { type PropsWithChildren, useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { type User } from "firebase/auth";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";

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
