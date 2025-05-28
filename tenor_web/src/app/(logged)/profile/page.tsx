"use client";

import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import ProfileCard from "./ProfileCard";

export default function ProfilePage() {
  const { user } = useFirebaseAuth();

  return <ProfileCard user={user}></ProfileCard>;
}
