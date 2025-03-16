"use client";

import React, { useState } from "react";
import FloatingLabelInput from "../FloatingLabelInput";
import PrimaryButton from "../PrimaryButton";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "~/utils/firebaseClient";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState({
    main: "",
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const { mutate: login } = api.auth.login.useMutation({
    onSuccess() {
      router.push("/");
    },
  });

  const handleSignUp = async () => {
    const newError = {
      main: "",
      name: "",
      email: "",
      password: "",
    };
    let failed = false;
    if (form.name === "") {
      newError.name = "Name is required";
      failed = true;
    }
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );
      const user = userCredential.user;

      // Update user profile with name
      await updateProfile(user, { displayName: form.name });
      const token = await user.getIdToken();
      login({ token });
    } catch (err: any) {
      if (typeof err === "object" && err !== null && "code" in err) {
        console.log(err.code);
        switch (err.code) {
          case "auth/weak-password":
            setError({
              ...newError,
              password: "Must be at least 6 characters",
            });
            break;
          case "auth/invalid-email":
            setError({ ...newError, email: "Enter a valid email" });
            break;
          case "auth/email-already-in-use":
            setError({ ...newError, email: "This email is already in use" });
            break;
          default:
            setError({
              ...newError,
              main: "Unexpected error. Please try again.",
            });
            break;
        }
      } else {
        setError({ ...newError, main: "Unexpected error. Please try again." });
      }
    }
    setLoading(false);
  };

  const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError({ ...error, main: "", [e.target.name]: "" });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <FloatingLabelInput
        type="text"
        onChange={handleInput}
        name="name"
        value={form.name}
        error={error.name}
      >
        Name
      </FloatingLabelInput>
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
      <PrimaryButton onClick={handleSignUp} loading={loading}>
        Create account
      </PrimaryButton>
      {error.main && <p className="text-app-fail">{error.main}</p>}
    </div>
  );
}
