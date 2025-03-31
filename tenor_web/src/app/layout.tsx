import "~/styles/globals.css";
import "react-tooltip/dist/react-tooltip.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { AlertProvider } from "./_hooks/useAlert";
import TooltipClientWrapper from "./_components/TooltipClientWrapper";
import { ConfirmationProvider } from "./_hooks/useConfirmation";

export const metadata: Metadata = {
  title: "Tenor",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>
          <TooltipClientWrapper>
            <AlertProvider>
              <ConfirmationProvider>{children}</ConfirmationProvider>
            </AlertProvider>
          </TooltipClientWrapper>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
