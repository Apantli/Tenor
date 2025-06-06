"use client";

import { auth } from "~/lib/db/firebaseClient";
import { signInWithPopup, GithubAuthProvider } from "firebase/auth";
import SecondaryButton from "~/app/_components/inputs/buttons/SecondaryButton";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useAlert } from "~/app/_hooks/useAlert";
import { githubLogoPath } from "~/lib/defaultValues/publicPaths";
import { useState } from "react";

export default function SignInGithub() {
  const router = useRouter();
  const { mutateAsync: login } = api.auth.login.useMutation();

  const { predefinedAlerts } = useAlert();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    const provider = new GithubAuthProvider();
    provider.addScope("user:email");
    provider.setCustomParameters({
      prompt: "select_account",
    });
    try {
      setIsSigningIn(true);
      const credential = await signInWithPopup(auth, provider);
      const token = await credential.user.getIdToken();
      const githubCredential =
        GithubAuthProvider.credentialFromResult(credential);
      const githubAccessToken = githubCredential?.accessToken;

      const res = await login({
        token,
        githubAccessToken,
      });
      if (res.success) {
        router.push("/");
      } else {
        predefinedAlerts.unexpectedError();
      }
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error) {
        if (error.code === "auth/account-exists-with-different-credential") {
          predefinedAlerts.emailInUseError();
        }
      }
      setIsSigningIn(false);
    }
  };

  return (
    <SecondaryButton
      onClick={handleSignIn}
      className="flex items-center justify-center gap-4"
      loading={isSigningIn}
    >
      <img className="h-6 w-auto" src={githubLogoPath} alt="" />
      <span className="text-app-text">Continue with Github</span>
    </SecondaryButton>
  );
}
