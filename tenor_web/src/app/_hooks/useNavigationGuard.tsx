"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

type GuardFunction = () => Promise<boolean>;

const NavigationGuardContext = createContext<{
  shouldBlock: GuardFunction;
  setShouldBlock: React.Dispatch<React.SetStateAction<GuardFunction>>;
}>({
  shouldBlock: async () => false,
  setShouldBlock: () => {},
});

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const [shouldBlock, setShouldBlock] = useState<GuardFunction>(
    () => async () => false,
  );

  return (
    <NavigationGuardContext.Provider
      value={{
        shouldBlock,
        setShouldBlock,
      }}
    >
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuardContext() {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error(
      "useNavigationGuardContext must be used within a NavigationGuardProvider",
    );
  }
  return context;
}

export default function useNavigationGuard(
  shouldBlock: GuardFunction,
  block?: boolean,
  refreshString?: string,
) {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error(
      "useNavigationGuard must be used within a NavigationGuardProvider",
    );
  }

  useEffect(() => {
    context.setShouldBlock(() => shouldBlock);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!block) return;
      const msg = refreshString;

      (e || window.event).returnValue = msg;
      return msg;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      context.setShouldBlock(() => async () => false);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [block]);
}
