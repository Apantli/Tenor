"use client";

import { useState } from "react";
import FloatingLabelInput from "../FloatingLabelInput";
import PrimaryButton from "../PrimaryButton";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "~/utils/firebaseClient";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function SignIn() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState({
    main: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { mutate: login } = api.auth.login.useMutation({
    onSuccess() {
      router.push("/");
    },
  });

  const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError({ ...error, main: "", [e.target.name]: "" });
  };

  const handleSignIn = async () => {
    const newError = {
      main: "",
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
      login({ token });
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err) {
        console.log(err.code);
        switch (err.code) {
          case "auth/invalid-email":
            setError({ ...newError, email: "Enter a valid email" });
            break;
          case "auth/invalid-credential":
            setError({ ...newError, main: "Incorrect email or password" });
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
      {error.main && <p className="text-app-fail">{error.main}</p>}
    </div>
  );
}
