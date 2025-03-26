"use client";

import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import ProfilePicture from "./ProfilePicture";
import Dropdown from "./Dropdown";
import Link from "next/link";
import { type PropsWithChildren } from "react";
import { useFirebaseAuth } from "../_hooks/useFirebaseAuth";
import useShiftKey from "../_hooks/useShiftKey";
import useLogout from "../_hooks/useLogout";

export default function Navbar({ children }: PropsWithChildren) {
  const { user } = useFirebaseAuth();
  const logout = useLogout();

  const shiftClicked = useShiftKey();

  const options = {
    profile: (
      <div className="flex items-center justify-between">
        <span>Profile</span>
        <span className="w-[120px] truncate text-right text-sm opacity-50">
          {user?.displayName ?? ""}
        </span>
      </div>
    ),
    signout: (
      <div className="flex items-center justify-between gap-2">
        <span className="text-app-fail">Sign out</span>
        <LogoutIcon htmlColor="red" fontSize="small" />
      </div>
    ),
  } as Record<string, React.ReactNode>;

  if (shiftClicked) {
    options.copyUID = (
      <div className="text-sm text-gray-500">Copy your user id</div>
    );
  }

  const dropdownCallback = async (option: keyof typeof options) => {
    switch (option) {
      case "profile":
        break;
      case "signout":
        await logout();
        break;
      case "copyUID":
        await navigator.clipboard.writeText(user?.uid ?? "");
    }
  };

  return (
    <nav className="flex h-16 items-center justify-between bg-app-primary px-8">
      <div className="flex items-center gap-8 text-white">
        <Link className="flex items-center" href="/">
          <img
            src={"/white_logo.png"}
            alt="Tenor Logo"
            className="h-7 w-auto"
          />
        </Link>
        {children}
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
