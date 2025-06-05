"use client";

import React, { useState } from "react";
import FloatingLabelInput from "../inputs/FloatingLabelInput";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "~/lib/db/firebaseClient";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";

export default function SignIn() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { mutateAsync: login } = api.auth.login.useMutation();
  const { predefinedAlerts } = useAlert();

  const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError({ ...error, [e.target.name]: "" });
  };

  const handleSignIn = async () => {
    const newError = {
      email: "",
      password: "",
    };
    let failed = false;
    if (form.email === "") {
      newError.email = "Email is required";
      failed = true;
    }
    if (form.password === "") {
      newError.password = "Password is required";
      failed = true;
    }
    if (failed) {
      setError(newError);
      return;
    }

    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );
      const token = await credential.user.getIdToken();
      const res = await login({ token });
      if (res.success) {
        router.push("/");
      } else {
        predefinedAlerts.unexpectedError();
      }
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err) {
        switch (err.code) {
          case "auth/invalid-email":
            setError({ ...newError, email: "Enter a valid email" });
            break;
          case "auth/invalid-credential":
            predefinedAlerts.loginError();
            break;
          default:
            predefinedAlerts.unexpectedError();
            break;
        }
      } else {
        predefinedAlerts.unexpectedError();
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <FloatingLabelInput
        type="text"
        onChange={handleInput}
        name="email"
        value={form.email}
        error={error.email}
        onSubmit={handleSignIn}
      >
        Email
      </FloatingLabelInput>
      <FloatingLabelInput
        type="password"
        onChange={handleInput}
        name="password"
        value={form.password}
        error={error.password}
        onSubmit={handleSignIn}
      >
        Password
      </FloatingLabelInput>
      <PrimaryButton loading={loading} floatingSpinner onClick={handleSignIn}>
        Sign in
      </PrimaryButton>
    </div>
  );
}
