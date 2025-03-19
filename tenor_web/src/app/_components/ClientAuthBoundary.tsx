"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { useFirebaseAuth } from "../_hooks/useFirebaseAuth";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export default function ClientAuthBoundary({ children }: PropsWithChildren) {
  const { user, loading } = useFirebaseAuth();
  const [refreshed, setRefreshed] = useState(false);
  const router = useRouter();

  const { mutateAsync: refreshSession } = api.auth.refreshSession.useMutation();

  useEffect(() => {
    if (loading) return;

    if (user) {
      user
        .getIdToken()
        .then(async (token) => {
          await refreshSession({ token });
          setRefreshed(true);
        })
        .catch((e) => {
          console.log("failed to refresh token");
          router.push("/login");
        });

      if (!user.emailVerified) {
        router.push("/verify-email");
      }
    } else {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user || !refreshed || !user.emailVerified) {
    return <></>;
  }

  return children;
}
