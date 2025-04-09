import { createContext, type MutableRefObject, useContext } from "react";

type ModificationContextType = {
  isModified: MutableRefObject<boolean>;
  setIsModified: (value: boolean) => void;
};

export const ModificationContext = createContext<
  ModificationContextType | undefined
>(undefined);

export const useModification = () => {
  const context = useContext(ModificationContext);
  if (!context)
    throw new Error(
      "useModification must be used within a ModificationProvider",
    );
  return context;
};
