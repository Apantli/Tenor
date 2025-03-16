"use client";

import Link from "next/link";
import React, { useState } from "react";
import SignInGithub from "~/app/_components/auth/SignInGithub";
import SignUp from "~/app/_components/auth/SignUp";

export default function RegisterPage() {
  const [mainError, setMainError] = useState("");

  return (
    <div className="mx-auto flex h-screen max-w-[300px] flex-col items-center justify-center gap-4">
      <img
        className="h-[80px] w-auto"
        src="/primary_logo.png"
        alt="Tenor logo"
      />
      <h1 className="text-xl font-semibold text-app-text">Create an account</h1>
      <div className="flex w-full flex-col gap-4">
        <SignInGithub setMainError={setMainError} />
        <div className="flex items-center gap-5">
          <div className="h-[1px] w-full border-t border-app-border"></div>
          <span className="text-app-border">or</span>
          <div className="h-[1px] w-full border-t border-app-border"></div>
        </div>
        <SignUp setMainError={setMainError} />
        {mainError && <p className="text-app-fail">{mainError}</p>}
      </div>
      <div className="flex w-full flex-col">
        <Link href="/login" className="w-full text-right text-app-primary">
          Already have an account?
        </Link>
      </div>
    </div>
  );
}
