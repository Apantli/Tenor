"use client";

import React, { useRef, useState } from "react";
import FloatingLabelInput from "../inputs/FloatingLabelInput";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "~/lib/db/firebaseClient";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useAlert } from "~/app/_hooks/useAlert";
import InputCheckbox from "../inputs/InputCheckbox";
import PrimaryButton from "../inputs/buttons/PrimaryButton";

export default function SignUp() {
  const router = useRouter();
  const { predefinedAlerts } = useAlert();

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const userRef = useRef<User | null>(null);

  const { mutateAsync: login } = api.auth.login.useMutation();

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

      const res = await login({ token });
      if (res.success) {
        await sendEmailVerification(user);
        router.push("/");
      } else {
        predefinedAlerts.unexpectedError();
      }
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err) {
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
            predefinedAlerts.unexpectedError();
            break;
        }
      } else {
        predefinedAlerts.unexpectedError();
      }
    }
    setLoading(false);
  };

  const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError({ ...error, [e.target.name]: "" });
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
      <div className="flex items-center gap-2">
        <InputCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} />
        <span className="text-xs text-app-text">
          I accept the{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-app-primary underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-app-primary underline"
          >
            Privacy Policy
          </a>
        </span>
      </div>
      <PrimaryButton
        disabled={!acceptedTerms}
        onClick={handleSignUp}
        loading={loading}
        floatingSpinner
      >
        Create account
      </PrimaryButton>
    </div>
  );
}
