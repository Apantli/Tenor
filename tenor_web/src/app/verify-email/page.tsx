import { redirect } from "next/navigation";
import React from "react";
import { auth } from "~/server/auth";
import ResendVerificationButton from "./ResendVerificationButton";

export default async function VerifyEmailPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  } else if (session.emailVerified) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex h-screen max-w-[450px] flex-col items-center justify-center gap-4">
      <img
        className="h-[80px] w-auto"
        src="/logos/primary_logo.png"
        alt="Tenor logo"
      />
      <h1 className="text-xl font-semibold text-app-text">
        Verify your email address
      </h1>
      <p className="text-center text-gray-400">
        In order to use your account, you must verify your email address by
        clicking the link we sent to your email. This page should refresh after
        clicking the link.
      </p>
      <ResendVerificationButton />
    </div>
  );
}
