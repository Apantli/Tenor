import "~/styles/globals.css";

import Navbar from "../_components/Navbar";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import ClientAuthBoundary from "../_components/ClientAuthBoundary";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tabs = [
    { name: "Projects", link: "/" },
    { name: "Muse", link: "/muse" },
    { name: "Frida", link: "/frida" },
    { name: "Speech", link: "/speech" },
    { name: "Files", link: "/files" },
  ];

  return (
    <ClientAuthBoundary>
      <Navbar tabs={tabs} />
      <main className="m-6 p-4">{children}</main>
    </ClientAuthBoundary>
  );
}
