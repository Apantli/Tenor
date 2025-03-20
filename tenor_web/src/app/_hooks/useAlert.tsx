"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import Alert from "../_components/AlertComponent";
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

type AlertFunction = (
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
    [removeAlert],
  );

  return (
    <AlertContext.Provider value={{ alert, alerts, removeAlert }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
        {alerts.map((alertItem) => (
          <AlertComponent
            key={alertItem.id}
            alertItem={alertItem}
            removeAlert={removeAlert}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertFunction => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context.alert;
};
