import Image from "next/image";
import WhiteLogo from "../_images/white_logo.png";
import NavbarMenu, { NavbarMenuProps } from "./NavbarMenu";
import { auth } from "~/server/auth";
import Link from "next/link";

export default async function Navbar({ tabs }: NavbarMenuProps) {
  const session = await auth();

  return (
    <nav className="bg-app-primary flex h-16 items-center justify-between px-4">
      <div className="flex items-center">
        <Image src={WhiteLogo} alt="Tenor Logo" className="h-7 w-auto" />
        <NavbarMenu tabs={tabs} />
      </div>
      <div className="flex items-center gap-4">
        <p className="text-white">{session?.user.name ?? "Signed out"}</p>
        <Link
          href={session ? "/api/auth/signout" : "/api/auth/signin"}
          className="text-app-primary rounded-md bg-white p-2"
        >
          {session ? "Sign out" : "Log in"}
        </Link>
      </div>
    </nav>
  );
}
