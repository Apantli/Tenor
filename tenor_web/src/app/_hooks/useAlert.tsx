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
    warning: (message: string) =>
      context.alert("Warning", message, {
        type: "warning",
        duration: 5000,
      }),
    error: (message: string) =>
      context.alert("Error", message, {
        type: "error",
        duration: 5000,
      }),
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
    emailSent: () =>
      context.alert(
        "Email sent!",
        "Please wait for it to arrive to your inbox",
        {
          type: "success",
          duration: 7000,
        },
      ),
    emailInUseError: () =>
      context.alert("Oops...", "This email is already in use", {
        type: "error",
        duration: 7000,
      }),
    loginError: () =>
      context.alert("Oops...", "Incorrect email or password", {
        type: "error",
        duration: 7000,
      }),
    userStoryNameError: () =>
      context.alert("Oops", "Please enter a name for the user story.", {
        type: "error",
        duration: 5000,
      }),
    userStoryCreateError: () =>
      context.alert("Error", "Failed to create user story. Please try again.", {
        type: "error",
        duration: 5000,
      }),
    issueNameError: () =>
      context.alert("Oops", "Please provide a name for the issue.", {
        type: "error",
        duration: 5000,
      }),
    issueStoryCreateError: () =>
      context.alert("Error", "Failed to create task. Please try again.", {
        type: "error",
        duration: 5000,
      }),
    epicNameError: () =>
      context.alert("Oops...", "Please enter a name for the epic.", {
        type: "error",
        duration: 5000,
      }),
    requirementNameError: () =>
      context.alert("Oops...", "Please enter a name for the requirement.", {
        type: "error",
        duration: 5000,
      }),
    requirementTypeError: () =>
      context.alert("Oops...", "Please select a type for the requirement.", {
        type: "error",
        duration: 5000,
      }),
    roleNameError: () =>
      context.alert("Oops...", "Please enter a name for the role.", {
        type: "error",
        duration: 5000,
      }),
    statusNameError: () =>
      context.alert("Oops...", "Please enter a name for the status.", {
        type: "error",
        duration: 5000,
      }),
    statusNameReservedError: (statusName: string) =>
      context.alert(
        "Default status name",
        `The status name "${statusName}" is reserved for default statuses and cannot be created manually.`,
        {
          type: "error",
          duration: 5000,
        },
      ),
    existingStatusError: (statusName: string) =>
      context.alert(
        "Error",
        `A status with the name "${statusName}" already exists. Please choose a different name.`,
        {
          type: "error",
          duration: 5000,
        },
      ),
    sprintDatesError: () =>
      context.alert("Oops...", "Please select valid start and end dates.", {
        type: "error",
        duration: 5000,
      }),
    sprintDurationError: () =>
      context.alert(
        "Oops...",
        "Sprint duration must be between 1 and 365 total days",
        {
          type: "error",
          duration: 5000,
        },
      ),
    sprintDateCollideError: (sprintNumber: number) =>
      context.alert("Oops...", `Dates collide with Sprint ${sprintNumber}.`, {
        type: "error",
        duration: 5000,
      }),
    ownerRoleError: () =>
      context.alert("Oops...", "You cannot edit the role of the owner.", {
        type: "error",
        duration: 5000,
      }),
    assignedRoleError: (roleName: string) =>
      context.alert(
        "Oops...",
        `You cannot delete the ${roleName} role because it is assigned to a user.`,
        {
          type: "error",
          duration: 5000,
        },
      ),
    existingRoleError: (roleName: string) =>
      context.alert(
        "Error",
        `A role with the name "${roleName}" already exists. Please choose a different name.`,
        {
          type: "error",
          duration: 5000,
        },
      ),
    removeOwnerError: () =>
      context.alert("Oops...", "You cannot remove the owner of the project.", {
        type: "error",
        duration: 5000,
      }),
    contextUpdateSuccess: () =>
      context.alert(
        "Success",
        "Project AI context has been updated successfully.",
        {
          type: "success",
          duration: 5000,
        },
      ),
    fileUploadSuccess: () =>
      context.alert(
        "Success",
        "A new file was added to your project AI context.",
        {
          type: "success",
          duration: 5000,
        },
      ),
    fileLimitExceeded: () =>
      context.alert("Oops...", "You exceeded the file size limit.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      }),
    linkUploadSuccess: () =>
      context.alert("Success", "Link added successfully.", {
        type: "success",
        duration: 5000,
      }),
    linkExistsError: () =>
      context.alert(
        "Link exists",
        "This link is already added to the context.",
        {
          type: "warning",
          duration: 3000,
        },
      ),
    storyPointsError: () =>
      context.alert(
        "Oops...",
        "Maximum sprint story points must be greater than 0",
        {
          type: "error",
          duration: 5000,
        },
      ),
    sizePointsLowerBoundError: (size: string) =>
      context.alert(
        "Invalid size values",
        `The value of ${size} must be greater than 0.`,
        {
          type: "error",
          duration: 5000,
        },
      ),
    sizePointsUpperBoundError: (upperBound: string) =>
      context.alert(
        "Invalid size values",
        `Please only input numbers less or equal than ${upperBound}.`,
        {
          type: "error",
          duration: 5000,
        },
      ),
    sizeOrderError: (size: string, prev: string) =>
      context.alert(
        "Invalid order",
        `${size} must be greater than or equal to ${prev}.`,
        {
          type: "error",
          duration: 5000,
        },
      ),
    scrumSettingsSuccess: () =>
      context.alert(
        "Success",
        "Scrum settings have been updated successfully",
        {
          type: "success",
          duration: 5000,
        },
      ),
    listNameError: () =>
      context.alert("Oops...", "Please enter a name for the list.", {
        type: "error",
        duration: 5000,
      }),
    projectNameError: () =>
      context.alert("Oops...", "Please enter a project name.", {
        type: "error",
        duration: 5000,
      }),
    projectNameLengthError: (upperBound: string) =>
      context.alert(
        "Limit exceeded",
        `The project name can't be longer than ${upperBound} characters.`,
        {
          type: "warning",
          duration: 3000,
        },
      ),
    projectCreateError: () =>
      context.alert(
        "Oops...",
        "There was an error creating the project. Try again later.",
        {
          type: "error",
          duration: 5000, // time in ms (5 seconds)
        },
      ),
    projectLogoError: () =>
      context.alert("Invalid image", "Please upload a valid image file", {
        type: "error",
        duration: 5000,
      }),
    projectLogoSizeError: () =>
      context.alert("File too large", "Logo image must be smaller than 3MB", {
        type: "error",
        duration: 5000,
      }),
    projectLogoDimensionsError: (height: number, width: number) =>
      context.alert(
        "Image too large",
        `Logo dimensions must be 1024x1024 pixels or smaller. This image is ${width}x${height}.`,
        {
          type: "error",
          duration: 5000,
        },
      ),
    projectSettingsSuccess: () =>
      context.alert(
        "Success",
        "Project settings have been updated successfully.",
        {
          type: "success",
          duration: 5000,
        },
      ),
    productivityUpdateSuccess: () =>
      context.alert("Success", "Productivity has been reloaded.", {
        type: "success",
        duration: 5000,
      }),
    headSetDisconnected: () =>
      context.alert("We're sorry...", "Muse headset got disconnected.", {
        type: "error",
        duration: 5000,
      }),
    headSetConnectionError: () =>
      context.alert(
        "We're sorry...",
        "Failed to connect to the Muse headset.",
        {
          type: "error",
          duration: 5000,
        },
      ),
  };

  return { alert: context.alert, predefinedAlerts };
};

let alertContextRef: AlertFunction | null = null;

export const setAlertContextRef = (ctx: AlertFunction) => {
  alertContextRef = ctx;
};

export const getAlertContextRef = () => alertContextRef;
