import { auth } from "~/server/auth";
import NavbarMenu, { type NavbarMenuProps } from "./NavbarMenu";
import LogoutButton from "./LogoutButton";

export default async function Navbar({ tabs }: NavbarMenuProps) {
  const session = await auth();

  return (
    <nav className="flex h-16 items-center justify-between bg-app-primary px-4">
      <div className="flex items-center">
        <img src={"/white_logo.png"} alt="Tenor Logo" className="h-7 w-auto" />
        <NavbarMenu tabs={tabs} />
      </div>
      <div className="flex items-center gap-4">
        <p className="text-white">{session?.displayName}</p>
        <LogoutButton />
      </div>
    </nav>
  );
}
