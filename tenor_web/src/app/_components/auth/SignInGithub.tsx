"use client";

import { auth } from "~/utils/firebaseClient";
import {
  signInWithPopup,
  GithubAuthProvider,
  OAuthCredential,
} from "firebase/auth";
import SecondaryButton from "../SecondaryButton";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useAlert } from "~/app/_hooks/useAlert";

export default function SignInGithub() {
  const router = useRouter();
  const { mutateAsync: login } = api.auth.login.useMutation();

  const { alert, predefinedAlerts } = useAlert();

  const handleSignIn = async () => {
    const provider = new GithubAuthProvider();
    provider.addScope("user:email");
    provider.setCustomParameters({
      prompt: "select_account",
    });
    try {
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
          alert("Oops...", "This email is already in use", {
            type: "error",
            duration: 7000,
          });
        }
      }
    }
  };

  return (
    <SecondaryButton
      onClick={handleSignIn}
      className="flex items-center justify-center gap-4"
    >
      <img className="h-6 w-auto" src="/github_logo.svg" alt="" />
      <span className="text-app-text">Continue with Github</span>
    </SecondaryButton>
  );
}
