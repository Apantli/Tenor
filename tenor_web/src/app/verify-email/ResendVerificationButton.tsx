"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "../_hooks/useFirebaseAuth";
import { sendEmailVerification } from "firebase/auth";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import SecondaryButton from "../_components/SecondaryButton";

export default function ResendVerificationButton() {
  const router = useRouter();

  const [message, setMessage] = useState<"none" | "sent" | "error">("none");

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
  }, [verificationResult]);

  const sendEmail = async () => {
    if (!user) return;

    try {
      setMessage("none");
      await sendEmailVerification(user);
      setMessage("sent");
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err) {
        console.log("FIREBASE ERROR:", err.code);
      }
      setMessage("error");
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
      {message === "sent" && <p className="text-app-primary">Email sent</p>}
      {message === "error" && (
        <p className="text-app-fail">
          Unexpecter error, please try again later
        </p>
      )}
      <SecondaryButton className="w-64" onClick={() => logout()}>
        Go back
      </SecondaryButton>
    </div>
  );
}
