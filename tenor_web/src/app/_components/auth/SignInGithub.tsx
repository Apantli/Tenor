"use client";

import { auth } from "~/utils/firebaseClient";
import { signInWithPopup, GithubAuthProvider } from "firebase/auth";
import SecondaryButton from "../SecondaryButton";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export default function SignInGithub() {
  const router = useRouter();
  const { mutate: login } = api.auth.login.useMutation({
    onSuccess() {
      router.push("/");
    },
  });

  const handleSignIn = async () => {
    const provider = new GithubAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });
    try {
      const credential = await signInWithPopup(auth, provider);
      const token = await credential.user.getIdToken();
      login({ token });
    } catch (error) {
      console.error("Sign-in error", error);
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
