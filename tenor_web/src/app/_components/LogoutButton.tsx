"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";

export default function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: clearCookie } = api.auth.logout.useMutation({
    onSuccess() {
      router.push("/login");
      queryClient.clear();
    },
  });

  const logout = () => {
    clearCookie();
  };

  return (
    <button
      onClick={logout}
      className="rounded-md bg-white p-2 text-app-primary"
    >
      Sign out
    </button>
  );
}
