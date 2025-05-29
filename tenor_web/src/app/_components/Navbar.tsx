"use client";

import LogoutIcon from "@mui/icons-material/Logout";
import ProfilePicture from "./ProfilePicture";
import Dropdown, { DropdownButton } from "./Dropdown";
import { useState, type PropsWithChildren } from "react";
import { useFirebaseAuth } from "../_hooks/useFirebaseAuth";
import useShiftKey from "../_hooks/useShiftKey";
import useLogout from "../_hooks/useLogout";
import { useRouter } from "next/navigation";
import InterceptedLink from "./InterceptableLink";
import { whiteLogoPath } from "~/lib/defaultValues/publicPaths";
import ProfileCard from "./ProfileCard";

export default function Navbar({ children }: PropsWithChildren) {
  const { user } = useFirebaseAuth();
  const logout = useLogout();
  const router = useRouter();

  const shiftClicked = useShiftKey();
  const [show, setShow] = useState(false);
  const handleLogout = async () => {
    await logout();
  };

  const handleCopyUID = async () => {
    await navigator.clipboard.writeText(user?.uid ?? "");
  };

  return (
    <nav className="flex h-16 items-center justify-between bg-app-primary px-8">
      <div className="flex flex-grow items-center gap-8 text-white">
        <InterceptedLink className="flex items-center" href="/">
          <img src={whiteLogoPath} alt="Tenor Logo" className="h-7 w-auto" />
        </InterceptedLink>
        {children}
      </div>
      <div className="flex items-center gap-4">
        <Dropdown
          label={
            <ProfilePicture
              user={user}
              hideTooltip
              className="cursor-pointer"
            />
          }
          menuClassName="w-56 mt-2"
        >
          <DropdownButton>
            <div
              className="flex items-center justify-between"
              onClick={() => setShow(true)}
            >
              <span>Profile</span>
              <span className="w-[120px] truncate text-right text-sm opacity-50">
                {user?.displayName ?? ""}
              </span>
            </div>
          </DropdownButton>
          <DropdownButton
            className="flex items-center justify-between gap-2"
            onClick={handleLogout}
          >
            <span className="text-app-fail">Sign out</span>
            <LogoutIcon htmlColor="red" fontSize="small" />
          </DropdownButton>
          {shiftClicked && process.env.NODE_ENV === "development" && (
            <DropdownButton
              className="text-sm text-gray-500"
              onClick={handleCopyUID}
            >
              Copy your user id
            </DropdownButton>
          )}
          {shiftClicked && process.env.NODE_ENV === "development" && (
            <DropdownButton
              onClick={() => router.push("/component-showcase")}
              className="text-sm text-gray-500"
            >
              Component showcase
            </DropdownButton>
          )}
        </Dropdown>
      </div>
      <ProfileCard show={show} setShow={setShow} />
    </nav>
  );
}
