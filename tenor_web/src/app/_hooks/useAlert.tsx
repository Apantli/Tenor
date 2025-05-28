"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type Alert from "../_components/AlertComponent";
import AlertComponent from "../_components/AlertComponent";

interface AlertOptions {
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export interface Alert {
  title: string;
  message: React.ReactNode;
  id: number;
  options: AlertOptions;
  show: boolean;
  enter: boolean;
}

export type AlertFunction = (
  title: string,
  message: React.ReactNode,
  options?: AlertOptions,
) => void;

interface AlertContextType {
  alert: AlertFunction;
  alerts: Alert[];
  removeAlert: (id: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: PropsWithChildren) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const nextId = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAlertContextRef(alert);
  }, []);

  const removeAlert = useCallback((id: number) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) =>
        alert.id === id ? { ...alert, show: false } : alert,
      ),
    );
    setTimeout(() => {
      setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
    }, 300); // Animation duration (adjust as needed)
  }, []);

  const removeAll = useCallback(() => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) => ({ ...alert, show: false })),
    );
    setTimeout(() => {
      setAlerts([]);
    }, 300); // Animation duration (adjust as needed)
  }, []);

  const alert: AlertFunction = useCallback(
    (title, message, options = { type: "info" }) => {
      const id = nextId.current++;
      const newAlert = { title, message, options, id, show: true, enter: true };
      setAlerts((prevAlerts) => [...prevAlerts, newAlert]);

      setTimeout(() => {
        setAlerts((prevAlerts) =>
          prevAlerts.map((alertItem) =>
            alertItem.id === id ? { ...alertItem, enter: false } : alertItem,
          ),
        );
      }, 10);
    },
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const timeout = setTimeout(() => {
      if (container.scrollHeight > container.clientHeight) {
        container.scrollTo({
          behavior: "smooth",
          top: container.scrollHeight,
        });
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [alerts]);

  return (
    <AlertContext.Provider value={{ alert, alerts, removeAlert }}>
      {children}
      <div
        className="fixed bottom-0 right-0 z-[300000] flex max-h-screen flex-col gap-3 overflow-y-auto p-5"
        ref={containerRef}
      >
        {alerts.map((alertItem) => (
          <AlertComponent
            key={alertItem.id}
            alertItem={alertItem}
            removeAlert={removeAlert}
            alertCount={alerts.length}
            removeAll={removeAll}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }

  const predefinedAlerts = {
    unexpectedError: () =>
      context.alert(
        "We're sorry",
        "There was an unexpected error. Please try again",
        { type: "error", duration: 7000 },
      ),
    cyclicDependency: () =>
      context.alert(
        "Oops...",
        "You created dependency cycle. Change reverted.",
        {
          type: "error",
          duration: 10000,
        },
      ),
    tooLongText: (label: string, limit: number) => {
      context.alert(
        "Oops...",
        `${label} can't be longer than ${limit} characters.`,
        {
          type: "error",
          duration: 5000,
        },
      );
    },
  };

  return { alert: context.alert, predefinedAlerts };
};

let alertContextRef: AlertFunction | null = null;

export const setAlertContextRef = (ctx: AlertFunction) => {
  alertContextRef = ctx;
};

export const getAlertContextRef = () => alertContextRef;
