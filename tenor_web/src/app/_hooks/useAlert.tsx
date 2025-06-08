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

  const alertTemplates = {
    // Used for unexpected errors, like server errors and contract errors
    error: (message: string) =>
      context.alert("Error", message, {
        type: "error",
        duration: 5000,
      }),
    // Used for user errors, like form validation
    oops: (message: string) =>
      context.alert("Oops...", message, {
        type: "error",
        duration: 5000,
      }),
    success: (message: string) =>
      context.alert("Success", message, {
        type: "success",
        duration: 5000,
      }),
    warning: (message: string) =>
      context.alert("Warning", message, {
        type: "warning",
        duration: 5000,
      }),
    info: (title: string, message: string) => context.alert(title, message),
  };

  const predefinedAlerts = {
    unexpectedError: () =>
      context.alert(
        "We're sorry",
        "There was an unexpected error. Please try again",
        { type: "error", duration: 7000 },
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
    cyclicDependency: () =>
      alertTemplates.oops("You created a dependency cycle. Change reverted."),
    emailInUseError: () => alertTemplates.oops("This email is already in use"),
    loginError: () =>
      alertTemplates.oops("Incorrect email or password. Please try again."),
    // #region User Stories
    userStoryNameError: () =>
      alertTemplates.oops("Please enter a name for the user story."),
    userStoryCreateError: () =>
      alertTemplates.error("Failed to create user story. Please try again."),
    // #endregion
    // #region Backlog Items
    backlogItemNameError: () =>
      alertTemplates.oops("Please enter a name for the backlog item."),
    backlogItemCreateError: () =>
      alertTemplates.error("Failed to create backlog item. Please try again."),
    // #endregion
    // #region Issues
    issueNameError: () =>
      alertTemplates.oops("Please provide a name for the issue."),
    issueNoReviewer: () =>
      alertTemplates.oops("Please provide a reviewer for the issue."),
    issueCreateError: () =>
      alertTemplates.error("Failed to create issue. Please try again."),
    // #endregion
    // #region Epic
    epicNameError: () =>
      alertTemplates.oops("Please enter a name for the epic."),
    // #endregion
    // #region Tasks
    taskNameError: () =>
      alertTemplates.oops("Please enter a name for the task."),
    taskCreateError: () =>
      alertTemplates.error("Failed to create task. Please try again."),
    // #endregion
    // #region Requirements
    requirementNameError: () =>
      alertTemplates.oops("Please enter a name for the requirement."),
    requirementTypeError: () =>
      alertTemplates.oops("Please select a type for the requirement."),
    // #endregion
    // #region Roles
    removeOwnerError: () =>
      alertTemplates.oops("You cannot remove the owner of the project."),
    roleNameError: () =>
      alertTemplates.oops("Please enter a name for the role."),
    ownerRoleError: () =>
      alertTemplates.oops("You cannot edit the role of the owner."),
    assignedRoleError: (roleName: string) =>
      alertTemplates.error(
        `You cannot delete the ${roleName} role because it is assigned to a user.`,
      ),
    existingRoleError: (roleName: string) =>
      alertTemplates.oops(
        `A role with the name "${roleName}" already exists. Please choose a different name.`,
      ),
    // #endregion
    // #region Statuses
    statusNameNotEditableError: () =>
      alertTemplates.oops(
        "You cannot edit nor delete the name of a default status. Please create a new status if you want to change it.",
      ),
    statusNameError: () =>
      alertTemplates.oops("Please enter a name for the status."),
    statusNameReservedError: (statusName?: string) =>
      alertTemplates.oops(
        `The status name "${statusName}" is reserved for default statuses and cannot be created manually.`,
      ),
    existingStatusError: (statusName: string) =>
      alertTemplates.oops(
        `A status with the name "${statusName}" already exists. Please choose a different name.`,
      ),
    defaultStatusNotModifiableError: (statusName: string) =>
      alertTemplates.oops(
        `You cannot edit nor delete the status "${statusName}" because it's a default status.`,
      ),
    // #endregion
    // #region Sprints
    sprintReordered: () =>
      alertTemplates.success(
        "The remaining sprints have been renumbered to stay in order.",
      ),
    sprintDatesError: () =>
      alertTemplates.oops(
        "Please select valid start and end dates for the sprint.",
      ),
    sprintDurationError: () =>
      alertTemplates.oops("Sprint duration must be at least three days long."),
    sprintDateCollideError: (sprintNumber: number) =>
      alertTemplates.oops(
        `The selected dates collide with Sprint ${sprintNumber}. Please choose different dates.`,
      ),
    // #endregion
    // #region Kanban
    assignedUnallowedStatus: () =>
      alertTemplates.oops("Only issues can be assigned to that status."),
    notAReviewer: () =>
      alertTemplates.oops(
        "You can't change the status of the issue because you're not the reviewer.",
      ),
    // #endregion
    // #region Context
    contextUpdateSuccess: () =>
      alertTemplates.success(
        "Project AI context has been updated successfully.",
      ),
    fileUploadSuccess: () =>
      alertTemplates.success(
        "File uploaded successfully. It will be processed shortly.",
      ),
    fileLimitExceeded: () =>
      alertTemplates.oops(
        "You exceeded the file size limit. Please upload a smaller file or delete existing ones.",
      ),
    duplicatedFile: () =>
      alertTemplates.oops(
        "A file with the same name is already added to the context.",
      ),
    linkUploadSuccess: () =>
      alertTemplates.success(
        "Link added successfully. It will be processed shortly.",
      ),
    linkExistsError: () =>
      alertTemplates.oops("This link is already added to the context."),
    linkInvalidError: (length: number) =>
      alertTemplates.oops(
        `${length} link${length > 1 ? "s" : ""} ${length > 1 ? "are" : "is"} invalid.`,
      ),
    emptyFilesError: (length: number) =>
      alertTemplates.oops(
        `We couldn't find text in ${length} context file${length > 1 ? "s" : ""}.`,
      ),

    // #endregion
    // #region Scrum Settings
    existingTagError: (itemTagType: string, tagName: string) =>
      alertTemplates.oops(
        `A ${itemTagType} with the name "${tagName}" already exists. Please choose a different name.`,
      ),
    failedToCreateTag: (itemTagType: string) =>
      alertTemplates.error(
        `Failed to create ${itemTagType}. Please try again.`,
      ),
    sizePointsLowerBoundError: (size: string) =>
      alertTemplates.oops(`The value of ${size} must be greater than 0.`),
    sizePointsUpperBoundError: (upperBound: number) =>
      alertTemplates.oops(
        `The value of size points must be less than or equal to ${upperBound}.`,
      ),
    sizeOrderError: (size: string, prev: string) =>
      alertTemplates.oops(`${size} must be greater than or equal to ${prev}.`),
    scrumSettingsSuccess: () =>
      alertTemplates.success("Scrum settings have been updated successfully."),
    listNameError: () =>
      alertTemplates.oops("Please enter a name for the list."),
    // #endregion
    // #region Project Settings
    projectNameError: () => alertTemplates.oops("Please enter a project name."),
    projectNameLengthError: (upperBound: string) =>
      alertTemplates.oops(
        `The project name can't be longer than ${upperBound} characters.`,
      ),
    projectCreateError: () =>
      alertTemplates.error(
        "There was an error creating the project. Please try again later.",
      ),
    projectLogoError: () =>
      alertTemplates.oops(
        "Please upload a valid image file for the project logo.",
      ),
    projectLogoSizeError: () =>
      alertTemplates.oops("Logo image must be smaller than 3MB."),
    projectLogoDimensionsError: (height: number, width: number) =>
      alertTemplates.oops(
        `Logo dimensions must be 1024x1024 pixels or smaller. This image is ${width}x${height}.`,
      ),
    projectSettingsSuccess: () =>
      alertTemplates.success(
        "Project settings have been updated successfully.",
      ),
    // #endregion
    // #region Reloads
    productivityUpdateSuccess: () =>
      alertTemplates.success("Productivity has been updated."),
    // #endregion
    // #region Muse Headset
    headSetDisconnected: () =>
      alertTemplates.oops("Muse headset got disconnected. Please reconnect."),
    headSetConnectionError: () =>
      alertTemplates.oops(
        "Failed to connect to the Muse headset. Please try again.",
      ),
    // #endregion

    // #region Completions
    completionWarning: () =>
      alertTemplates.warning(
        "Please wait until the current completion finishes.",
      ),
    formCompletionError: () =>
      alertTemplates.oops("Please answer all questions."),
    // #endregion
    // #region Other
    tooLongText: (label: string, limit: number) =>
      alertTemplates.oops(`${label} can't be longer than ${limit} characters.`),
    // #endregion
  };

  return { predefinedAlerts, alertTemplates };
};

let alertContextRef: AlertFunction | null = null;

export const setAlertContextRef = (ctx: AlertFunction) => {
  alertContextRef = ctx;
};

export const getAlertContextRef = () => alertContextRef;
