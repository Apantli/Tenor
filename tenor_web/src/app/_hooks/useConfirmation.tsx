"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import Popup from "../_components/Popup";
import SecondaryButton from "../_components/buttons/SecondaryButton";
import PrimaryButton from "../_components/buttons/PrimaryButton";
import DeleteButton from "../_components/buttons/DeleteButton";

export interface Confirmation {
  title: string;
  message: React.ReactNode;
  destructive: boolean;
  cancellationMsg: string;
  confirmationMsg: string;
}

type ConfirmationFunction = (
  title: string,
  message: string,
  confirmationMsg?: string,
  cancellationMsg?: string,
  destructive?: boolean,
) => Promise<boolean>;

interface ConfirmationContextType {
  confirm: ConfirmationFunction;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(
  undefined,
);

export const ConfirmationProvider = ({ children }: PropsWithChildren) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationInfo, setConfirmationInfo] = useState<Confirmation | null>(
    null,
  );
  const promiseCallback = useRef<(v: boolean) => void>();

  const confirm: ConfirmationFunction = (
    title,
    message,
    confirmationMsg = "Confirm",
    cancellationMsg = "Cancel",
    destructive = true,
  ) => {
    setConfirmationInfo({
      title,
      message,
      cancellationMsg,
      confirmationMsg,
      destructive,
    });
    setShowConfirmation(true);
    return new Promise((res) => {
      const callback = (response: boolean) => res(response);
      promiseCallback.current = callback;
    });
  };

  const handleResolve = (result: boolean) => {
    setTimeout(() => promiseCallback.current?.(result), 200);
    setShowConfirmation(false);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <Popup
        size="small"
        show={showConfirmation}
        dismiss={() => handleResolve(false)}
        reduceTopPadding
        zIndex={200000}
        footer={
          <div className="flex gap-2">
            <SecondaryButton
              onClick={() => handleResolve(false)}
              data-cy="cancel-button"
            >
              {confirmationInfo?.cancellationMsg}
            </SecondaryButton>
            {!confirmationInfo?.destructive && (
              <PrimaryButton
                onClick={() => handleResolve(true)}
                data-cy="confirm-button"
              >
                {confirmationInfo?.confirmationMsg}
              </PrimaryButton>
            )}
            {confirmationInfo?.destructive && (
              <DeleteButton
                onClick={() => handleResolve(true)}
                data-cy="confirm-button"
              >
                {confirmationInfo?.confirmationMsg}
              </DeleteButton>
            )}
          </div>
        }
        title={
          <h1 className="mb-5 min-w-96 pr-10 text-2xl font-semibold">
            {confirmationInfo?.title}
          </h1>
        }
      >
        <p className="text-lg">{confirmationInfo?.message}</p>
      </Popup>
    </ConfirmationContext.Provider>
  );
};

export default function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error(
      "useConfirmation must be used within a ConfirmationProvider",
    );
  }

  return context.confirm;
}
