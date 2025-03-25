"use client";

import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import ProfilePicture from "./ProfilePicture";
import Dropdown from "./Dropdown";
import { useFirebaseAuth } from "../_hooks/useFirebaseAuth";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, loading } = useFirebaseAuth();
  const { mutateAsync: logout } = api.auth.logout.useMutation();
  const router = useRouter();

  if (loading) return <></>;

  const options = {
    profile: (
      <div className="flex items-center justify-between">
        <span>Profile</span>
        <span className="w-[120px] truncate text-right text-sm opacity-50">
          {user?.displayName}
        </span>
      </div>
    ),
    signout: (
      <div className="flex items-center justify-between gap-2">
        <span className="text-app-fail">Sign out</span>
        <LogoutIcon htmlColor="red" fontSize="small" />
      </div>
    ),
  };
  const dropdownCallback = async (option: keyof typeof options) => {
    switch (option) {
      case "profile":
        break;
      case "signout":
        const res = await logout();
        if (res.success) {
          router.push("/login");
        }
        break;
    }
  };

  return (
    <nav className="flex h-16 items-center justify-between bg-app-primary px-4">
      <div className="flex items-center">
        <img src={"/white_logo.png"} alt="Tenor Logo" className="h-7 w-auto" />
      </div>
      <div className="flex items-center gap-4">
        <SettingsIcon htmlColor="white" fontSize={"large"} />
        <Dropdown
          options={options}
          callback={dropdownCallback}
          menuClassName="w-56"
        >
          <ProfilePicture user={user} hideTooltip />
        </Dropdown>
      </div>
    </nav>
  );
}
