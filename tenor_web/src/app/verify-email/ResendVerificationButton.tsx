"use client";

import { useEffect } from "react";
import { useFirebaseAuth } from "../_hooks/useAuth";
import { sendEmailVerification } from "firebase/auth";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import SecondaryButton from "../_components/SecondaryButton";

export default function ResendVerificationButton() {
  const router = useRouter();

  const { user, loading } = useFirebaseAuth();
  const { mutate: checkVerification } = api.auth.checkVerification.useMutation({
    onSuccess(res) {
      if (res.verified) {
        router.push("/");
      }
    },
  });
  const { mutate: logout } = api.auth.logout.useMutation({
    onSuccess(res) {
      if (res.success) {
        router.push("/login");
      }
    },
  });

  const sendEmail = () => {
    if (!user) return;

    sendEmailVerification(user);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkVerification();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      void sendEmailVerification(user);
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-8">
      <span className="flex gap-2">
        Didn't receive an email?
        <button
          className="text-app-primary"
          onClick={sendEmail}
          disabled={loading}
        >
          Resend
        </button>
      </span>
      <SecondaryButton onClick={() => logout()}>Go back</SecondaryButton>
    </div>
  );
}
