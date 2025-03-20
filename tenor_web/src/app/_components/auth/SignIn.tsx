"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import FloatingLabelInput from "../FloatingLabelInput";
import PrimaryButton from "../PrimaryButton";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "~/utils/firebaseClient";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

interface Props {
  setMainError: Dispatch<SetStateAction<string>>;
}

export default function SignIn({ setMainError }: Props) {
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

  const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError({ ...error, [e.target.name]: "" });
    setMainError("");
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
        setMainError("Unexpected error. Please try again.");
      }
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err) {
        console.log(err.code);
        switch (err.code) {
          case "auth/invalid-email":
            setError({ ...newError, email: "Enter a valid email" });
            break;
          case "auth/invalid-credential":
            setMainError("Incorrect email or password");
            break;
          default:
            setMainError("Unexpected error. Please try again.");
            break;
        }
      } else {
        setMainError("Unexpected error. Please try again.");
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
      >
        Email
      </FloatingLabelInput>
      <FloatingLabelInput
        type="password"
        onChange={handleInput}
        name="password"
        value={form.password}
        error={error.password}
      >
        Password
      </FloatingLabelInput>
      <PrimaryButton loading={loading} onClick={handleSignIn}>
        Sign in
      </PrimaryButton>
    </div>
  );
}
