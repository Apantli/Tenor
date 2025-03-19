"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { cn } from "~/lib/utils";

interface AlertOptions {
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface Alert {
  title: string;
  message: React.ReactNode;
  id: number;
  options: AlertOptions;
  show: boolean;
  enter: boolean;
}

interface AlertFunction {
  (title: string, message: React.ReactNode, options?: AlertOptions): void;
}

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

      if (options.duration !== undefined) {
        setTimeout(() => {
          removeAlert(id);
        }, options.duration);
      }
    },
    [removeAlert],
  );

  const textColors = {
    success: "text-app-success",
    error: "text-app-fail",
    info: "text-app-secondary",
    warning: "text-orange-500",
  };

  const lineColors = {
    success: "bg-app-success",
    error: "bg-app-fail",
    info: "bg-app-secondary",
    warning: "bg-orange-500",
  };

  return (
    <AlertContext.Provider value={{ alert, alerts, removeAlert }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
        {alerts.map((alertItem, index) => (
          <div
            key={alertItem.id}
            className={cn("relative translate-x-0 transition ease-in", {
              "translate-x-[450px] opacity-0": !alertItem.show,
              "translate-y-[200px]": alertItem.enter,
            })}
          >
            <div className="flex w-96 flex-col gap-1 rounded-lg border-2 border-app-border bg-white px-6 pb-5 pt-4 shadow-xl">
              <h1
                className={`text-lg font-semibold ${textColors[alertItem.options.type]}`}
              >
                {alertItem.title}
              </h1>
              {alertItem.message}
            </div>
            <div
              className={`absolute bottom-0 left-0 h-2 w-full rounded-b-lg ${lineColors[alertItem.options.type]}`}
            ></div>
            <button
              className="absolute right-5 top-2 text-3xl font-thin"
              onClick={() => removeAlert(alertItem.id)}
            >
              &times;
            </button>
          </div>
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
