import "~/styles/globals.css";
import "react-tooltip/dist/react-tooltip.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { AlertProvider } from "./_hooks/useAlert";
import TooltipClientWrapper from "./_components/TooltipClientWrapper";
import { ConfirmationProvider } from "./_hooks/useConfirmation";
import { NavigationGuardProvider } from "./_hooks/useNavigationGuard";
import { favIconPath } from "~/lib/defaultValues/publicPaths";

export const metadata: Metadata = {
  title: "Tenor",
  icons: [{ rel: "icon", url: favIconPath }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="relative">
        <TRPCReactProvider>
          <NavigationGuardProvider>
            <TooltipClientWrapper>
              <AlertProvider>
                <ConfirmationProvider>{children}</ConfirmationProvider>
              </AlertProvider>
            </TooltipClientWrapper>
          </NavigationGuardProvider>
        </TRPCReactProvider>
        <div
          id="portal-root"
          className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden"
        />
      </body>
    </html>
  );
}
