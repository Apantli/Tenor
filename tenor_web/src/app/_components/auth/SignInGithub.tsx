"use client";

import { auth } from "~/utils/firebaseClient";
import { signInWithPopup, GithubAuthProvider } from "firebase/auth";
import SecondaryButton from "../SecondaryButton";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

interface Props {
  setMainError: Dispatch<SetStateAction<string>>;
}

export default function SignInGithub({ setMainError }: Props) {
  const router = useRouter();
  const { mutate: login } = api.auth.login.useMutation({
    onSuccess(res) {
      if (res.success) {
        router.push("/");
      } else if (res.error === "UNAUTHORIZED_DOMAIN") {
        setMainError("Email domain must be @tec.mx");
      } else if (
        res.error === "FIREBASE" &&
        res.code === "auth/email-already-exists"
      ) {
        setMainError("This email is already in use");
      }
    },
  });

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

      login({
        token,
        githubAccessToken,
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error) {
        if (error.code === "auth/account-exists-with-different-credential") {
          setMainError("This email is already in use");
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
