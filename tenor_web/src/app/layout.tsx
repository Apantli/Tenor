import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import Navbar from "./_components/Navbar";

export const metadata: Metadata = {
  title: "Tenor",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tabs = [
    { name: "Projects", link: "/" },
    { name: "Muse", link: "/muse" },
    { name: "Frida", link: "/frida" },
    { name: "Speech", link: "/speech" },
  ];

  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>
          <Navbar tabs={tabs} />
          <main className="p-4">{children}</main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
