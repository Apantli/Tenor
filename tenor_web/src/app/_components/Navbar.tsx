"use client";

import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import ProfilePicture from "./ProfilePicture";
import Dropdown, { DropdownButton } from "./Dropdown";
import Link from "next/link";
import { type PropsWithChildren } from "react";
import { useFirebaseAuth } from "../_hooks/useFirebaseAuth";
import useShiftKey from "../_hooks/useShiftKey";
import useLogout from "../_hooks/useLogout";

export default function Navbar({ children }: PropsWithChildren) {
  const { user } = useFirebaseAuth();
  const logout = useLogout();

  const shiftClicked = useShiftKey();

  const handleLogout = async () => {
    await logout();
  };

  const handleCopyUID = async () => {
    await navigator.clipboard.writeText(user?.uid ?? "");
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
          label={<ProfilePicture user={user} hideTooltip />}
          menuClassName="w-56 mt-2"
        >
          <DropdownButton className="flex items-center justify-between">
            <span>Profile</span>
            <span className="w-[120px] truncate text-right text-sm opacity-50">
              {user?.displayName ?? ""}
            </span>
          </DropdownButton>
          <DropdownButton
            className="flex items-center justify-between gap-2"
            onClick={handleLogout}
          >
            <span className="text-app-fail">Sign out</span>
            <LogoutIcon htmlColor="red" fontSize="small" />
          </DropdownButton>
          {shiftClicked && (
            <DropdownButton
              className="text-sm text-gray-500"
              onClick={handleCopyUID}
            >
              Copy your user id
            </DropdownButton>
          )}
        </Dropdown>
      </div>
    </nav>
  );
}
