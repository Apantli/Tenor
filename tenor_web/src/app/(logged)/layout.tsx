import "~/styles/globals.css";

import Navbar from "../_components/Navbar";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  } else if (!session.emailVerified) {
    redirect("/verify-email");
  }

  const tabs = [
    { name: "Projects", link: "/" },
    { name: "Muse", link: "/muse" },
    { name: "Frida", link: "/frida" },
    { name: "Speech", link: "/speech" },
    { name: "Files", link: "/files" },
  ];

  return (
    <>
      <Navbar tabs={tabs} />
      <main className="m-6 p-4">{children}</main>
    </>
  );
}
