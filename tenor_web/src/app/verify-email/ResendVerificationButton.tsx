"use client";

import { useEffect } from "react";
import { useFirebaseAuth } from "../_hooks/useFirebaseAuth";
import { sendEmailVerification } from "firebase/auth";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import SecondaryButton from "../_components/inputs/buttons/SecondaryButton";
import { useAlert } from "../_hooks/useAlert";

export default function ResendVerificationButton() {
  const router = useRouter();

  const { predefinedAlerts } = useAlert();

  const { user, loading } = useFirebaseAuth();
  const { data: verificationResult } = api.auth.checkVerification.useQuery(
    undefined,
    {
      refetchInterval: 10000,
    },
  );

  const { mutate: logout } = api.auth.logout.useMutation({
    onSuccess(res) {
      if (res.success) {
        router.push("/login");
      }
    },
  });

  useEffect(() => {
    const checkVerification = async () => {
      if (verificationResult?.verified) {
        await user?.reload();
        router.push("/");
      }
    };
    void checkVerification();
  }, [verificationResult, router, user]);

  const sendEmail = async () => {
    if (!user) return;

    try {
      await sendEmailVerification(user);
      predefinedAlerts.emailSent();
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err) {
        console.log("FIREBASE ERROR:", err.code);
      }
      predefinedAlerts.unexpectedError();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <span className="flex gap-2">
        Didn&apos;t receive an email?
        <button
          className="text-app-primary"
          onClick={sendEmail}
          disabled={loading}
        >
          Resend
        </button>
      </span>
      <SecondaryButton className="w-64" onClick={() => logout()}>
        Go back
      </SecondaryButton>
    </div>
  );
}
