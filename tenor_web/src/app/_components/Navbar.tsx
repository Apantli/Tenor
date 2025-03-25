import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import ProfilePicture from "./ProfilePicture";
import Dropdown from "./Dropdown";
<<<<<<< HEAD
import Link from "next/link";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { redirect } from "next/navigation";
import { type PropsWithChildren } from "react";

export default async function Navbar({ children }: PropsWithChildren) {
  const session = await auth();
=======
import { useFirebaseAuth } from "../_hooks/useFirebaseAuth";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const { user, loading } = useFirebaseAuth();
  const { mutateAsync: logout } = api.auth.logout.useMutation();
  const router = useRouter();
>>>>>>> 029a6cd (Tab bar navigation)

  const options = {
    profile: (
      <div className="flex items-center justify-between">
        <span>Profile</span>
        <span className="w-[120px] truncate text-right text-sm opacity-50">
          {session?.displayName}
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
    "use server"; // this enables passing function callbacks into client components
    switch (option) {
      case "profile":
        break;
      case "signout":
        const res = await api.auth.logout();
        if (res.success) {
          redirect("/login");
        }
        break;
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
          <ProfilePicture user={session} hideTooltip />
        </Dropdown>
      </div>
    </nav>
  );
}
