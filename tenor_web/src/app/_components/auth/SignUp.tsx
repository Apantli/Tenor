"use client";

import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import FloatingLabelInput from "../FloatingLabelInput";
import PrimaryButton from "../PrimaryButton";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  User,
} from "firebase/auth";
import { auth } from "~/utils/firebaseClient";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

interface Props {
  setMainError: Dispatch<SetStateAction<string>>;
}

export default function SignUp({ setMainError }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const userRef = useRef<User | null>(null);

  const { mutate: login } = api.auth.login.useMutation({
    async onSuccess(res) {
      if (res.success) {
        if (userRef.current) {
          await sendEmailVerification(userRef.current);
        }
        router.push("/");
      } else if (res.error === "UNAUTHORIZED_DOMAIN") {
        setError({ ...error, email: "Email domain must be @tec.mx" });
      }
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
      userRef.current = user;

      // Update user profile with name
      await updateProfile(user, { displayName: form.name });
      const token = await user.getIdToken();

      login({ token });
    } catch (err) {
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
            setMainError("Unexpected error. Please try again.");
            break;
        }
      } else {
        setMainError("Unexpected error. Please try again.");
      }
    }
    setLoading(false);
  };

  const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError({ ...error, [e.target.name]: "" });
    setMainError("");
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
    </div>
  );
}
