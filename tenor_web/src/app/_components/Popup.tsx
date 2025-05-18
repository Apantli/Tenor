"use client";

import { useEffect, useState, type PropsWithChildren, useRef } from "react";
import { cn } from "~/lib/utils";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/EditOutlined";
import CloseSidebarIcon from "@mui/icons-material/LastPage";
import { type ClassNameValue } from "tailwind-merge";
import PrimaryButton from "./buttons/PrimaryButton";
import { useSearchParam } from "../_hooks/useSearchParam";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import usePersistentState from "../_hooks/usePersistentState";

interface Props {
  show: boolean;
  size: "small" | "large";
  dismiss: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  disablePassiveDismiss?: boolean;
  sidebar?: React.ReactNode;
  sidebarClassName?: ClassNameValue;
  editMode?: boolean;
  setEditMode?: (edit: boolean) => void;
  saving?: boolean;
  reduceTopPadding?: boolean;
  zIndex?: number;
  className?: string;
  saveText?: string;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Popup({
  show,
  size,
  dismiss,
  children,
  title,
  footer,
  disablePassiveDismiss,
  sidebar,
  editMode,
  setEditMode,
  saving,
  reduceTopPadding,
  sidebarClassName,
  zIndex,
  className,
  saveText = "Save",
  setSidebarOpen,
}: Props & PropsWithChildren) {
  const [popIn, setPopIn] = useState(false);
  // const [sidebarOpen, setSidebarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      // setPopIn(true);
      const timeout = setTimeout(() => setPopIn(true), 1);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setPopIn(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  useEffect(() => {
    if (disablePassiveDismiss) return;

    const escapeListener = (e: KeyboardEvent) => {
      if (show && e.key == "Escape") dismiss();
    };

    window.addEventListener("keyup", escapeListener);
    return () => window.removeEventListener("keyup", escapeListener);
  });

  const [showSidebar, setShowSidebar] = usePersistentState(
    false,
    "showSidebar",
  );

  useEffect(() => {
    if (!setSidebarOpen) return;
    setSidebarOpen(showSidebar);
  }, [setSidebarOpen]);

  return (
    (show || popIn) && (
      <>
        <div
          className={cn(
            "fixed left-0 top-0 h-screen w-screen bg-black opacity-0 transition duration-200",
            {
              "opacity-70": popIn && show,
            },
          )}
          style={{ zIndex: zIndex ?? 100000 }}
          onClick={() => {
            if (!disablePassiveDismiss) dismiss();
          }}
        ></div>
        <div
          className={cn(
            "fixed left-1/2 top-1/2 flex max-h-[calc(100vh-40px)] max-w-[calc(100vw-40px)] -translate-x-1/2 -translate-y-1/2 scale-90 flex-col justify-between gap-4 rounded-2xl bg-white p-5 opacity-0 transition duration-200",
            {
              "max-h-[min(500px,calc(100vh-40px))] max-w-[min(700px,calc(100vw-40px))]":
                size === "small",
              "h-[700px] w-[956px]": size === "large",
              "scale-100 opacity-100": popIn && show,
            },
            className,
          )}
          style={{ zIndex: (zIndex ?? 100000) + 1 }}
          ref={containerRef}
          data-cy="popup"
        >
          <div className="grow justify-between gap-4 overflow-x-hidden overflow-y-hidden">
            <div className="flex h-full justify-between">
              <div
                className={cn("flex grow flex-col justify-between pt-8", {
                  "pt-0": !!reduceTopPadding,
                })}
              >
                <div className="flex flex-1 shrink grow justify-between overflow-y-hidden">
                  <div
                    className={cn("flex flex-1 flex-col overflow-hidden p-2", {
                      "pr-0": sidebar === undefined || !showSidebar,
                    })}
                  >
                    <div className="flex justify-between gap-2">
                      {title !== undefined && title}
                      {title === undefined && <div></div>}
                      {editMode === false && (
                        <div className="flex shrink-0 flex-col gap-2">
                          <button
                            className="text-3xl text-gray-600"
                            onClick={() => setEditMode?.(true)}
                          >
                            <EditIcon fontSize="inherit" />
                          </button>
                        </div>
                      )}
                      {editMode === true && (
                        <div className="flex shrink-0 flex-col gap-2">
                          <PrimaryButton
                            onClick={() => setEditMode?.(false)}
                            loading={saving}
                          >
                            {saveText}
                          </PrimaryButton>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto">{children}</div>
                  </div>
                </div>

                {footer !== undefined && editMode !== true && (
                  <div className="ml-auto mt-3 shrink-0 grow-0">{footer}</div>
                )}
              </div>
              {sidebar !== undefined && showSidebar && (
                <div
                  className={cn(
                    "ml-3 h-full w-0 shrink-0 overflow-y-auto border-l border-app-border px-3 pb-3 pl-5 pt-12",
                    sidebarClassName,
                  )}
                >
                  {sidebar}
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "absolute right-5 top-3 flex gap-2 text-3xl text-gray-600",
              {
                "top-5": !!reduceTopPadding,
              },
            )}
          >
            {sidebar !== undefined && (
              <button
                className="text-3xl text-gray-600"
                onClick={() => {
                  setShowSidebar(!showSidebar);
                  setSidebarOpen?.(!showSidebar);
                }}
                data-tooltip-id="tooltip"
                data-tooltip-content={
                  showSidebar ? "Hide details" : "Show details"
                }
                data-tooltip-place="left"
                data-tooltip-delay-show={500}
              >
                <MenuOpenIcon
                  fontSize="inherit"
                  className={cn({ "rotate-180": showSidebar })}
                />
              </button>
            )}
            <button onClick={dismiss} data-cy="popup-close-button">
              <CloseIcon fontSize="inherit" />
            </button>
          </div>
        </div>
      </>
    )
  );
}

// Use this hook instead of managing your own state when you want the popup not always be rendered
export const usePopupVisibilityState = () => {
  const [showInternal, setShowInternal] = useState(false);
  const [animating, setAnimating] = useState(false);

  const setShow = (newShow: boolean) => {
    if (newShow) {
      setShowInternal(true);
      setAnimating(true);
    } else {
      setShowInternal(false);
      setTimeout(() => {
        setAnimating(false);
      }, 300);
    }
  };

  // The component should render based on 'showInternal' or 'animating'
  const isVisible = showInternal || animating;

  return [isVisible, showInternal, setShow] as const;
};

interface SidebarPopupProps {
  show: boolean;
  dismiss: () => void | Promise<void>;
  afterDismissWithCloseButton?: () => void;
  disablePassiveDismiss?: boolean;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  editMode?: boolean;
  setEditMode?: (edit: boolean) => void;
  saving?: boolean;
  saveText?: string;
}

export function SidebarPopup({
  children,
  show,
  dismiss,
  afterDismissWithCloseButton,
  disablePassiveDismiss,
  title,
  footer,
  editMode,
  setEditMode,
  saving,
  saveText = "Save",
}: SidebarPopupProps & PropsWithChildren) {
  const [slideIn, setSlideIn] = useState(false);
  const [fullyVisible, setFullyVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getParam } = useSearchParam();

  useEffect(() => {
    if (show) {
      const timeoutSlideIn = setTimeout(() => setSlideIn(true), 1);
      const timeoutFullyVisible = setTimeout(() => setFullyVisible(true), 200);
      return () => {
        clearTimeout(timeoutSlideIn);
        clearTimeout(timeoutFullyVisible);
      };
    } else {
      setFullyVisible(false);
      const timeout = setTimeout(() => setSlideIn(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  return (
    (show || slideIn) && (
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-[61] flex h-[700px] max-h-[calc(100vh-40px)] w-[956px] max-w-[calc(100vw-40px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl",
          {
            "overflow-visible": fullyVisible,
          },
        )}
      >
        <div
          className={cn(
            "fixed left-0 top-0 z-[62] h-full w-full rounded-2xl bg-black opacity-0 transition duration-200",
            {
              "opacity-30": show && slideIn,
            },
          )}
          onClick={async (e) => {
            if (!disablePassiveDismiss) await dismiss();
            e.stopPropagation();
          }}
        ></div>
        <div
          className={cn(
            "fixed right-0 top-0 z-[63] h-full w-[478px] translate-x-full rounded-r-2xl bg-white p-5 pt-12 transition duration-200",
            {
              "translate-x-0": show && slideIn,
            },
          )}
          ref={containerRef}
        >
          <div className="flex h-full grow flex-col justify-between pt-0">
            <div className="flex flex-1 shrink grow justify-between overflow-y-hidden">
              <div className="flex flex-1 flex-col overflow-hidden p-2">
                <div className="flex justify-between gap-2">
                  {title !== undefined && title}
                  {title === undefined && <div></div>}
                  {editMode === false && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        className="text-3xl text-gray-600"
                        onClick={() => setEditMode?.(true)}
                      >
                        <EditIcon fontSize="inherit" />
                      </button>
                    </div>
                  )}
                  {editMode === true && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <PrimaryButton
                        onClick={() => setEditMode?.(false)}
                        loading={saving}
                      >
                        {saveText}
                      </PrimaryButton>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">{children}</div>
              </div>
            </div>

            {footer !== undefined && editMode !== true && (
              <div className="ml-auto mt-3 shrink-0 grow-0">{footer}</div>
            )}
          </div>
          <button
            onClick={async () => {
              await dismiss();
              afterDismissWithCloseButton?.();
            }}
            className="absolute right-5 top-3 text-3xl text-gray-600"
            data-cy="popup-close-button"
          >
            {afterDismissWithCloseButton !== undefined && getParam("ts") && (
              <CloseIcon fontSize="inherit" />
            )}
            {(afterDismissWithCloseButton === undefined || !getParam("ts")) && (
              <CloseSidebarIcon fontSize="inherit" />
            )}
          </button>
        </div>
      </div>
    )
  );
}
