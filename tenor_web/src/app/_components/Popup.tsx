"use client";

import {
  useEffect,
  useState,
  type PropsWithChildren,
  createContext,
  useRef,
  useContext,
} from "react";
import { cn } from "~/lib/utils";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/EditOutlined";
import { type ClassNameValue } from "tailwind-merge";
import PrimaryButton from "./buttons/PrimaryButton";

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
}

const PopupContext = createContext<React.RefObject<HTMLDivElement> | null>(
  null,
);

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
}: Props & PropsWithChildren) {
  const [popIn, setPopIn] = useState(false);
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

  return (
    (show || popIn) && (
      <PopupContext.Provider value={containerRef}>
        <div
          className={cn(
            "fixed left-0 top-0 h-screen w-screen bg-black opacity-0 transition duration-200",
            {
              "opacity-70": popIn && show,
            },
          )}
          style={{ zIndex: zIndex ?? 100 }}
          onClick={() => {
            if (!disablePassiveDismiss) dismiss();
          }}
        ></div>
        <div
          className={cn(
            "fixed left-1/2 top-1/2 flex max-h-[calc(100vh-40px)] max-w-[calc(100vw-40px)] -translate-x-1/2 -translate-y-1/2 scale-90 flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-white p-5 opacity-0 transition duration-200",
            {
              "max-h-[min(500px,calc(100vh-40px))] max-w-[min(700px,calc(100vw-40px))]":
                size === "small",
              "h-[700px] w-[956px]": size === "large",
              "scale-100 opacity-100": popIn && show,
            },
            className,
          )}
          style={{ zIndex: (zIndex ?? 100) + 1 }}
          ref={containerRef}
        >
          <div className="grow justify-between gap-4 overflow-y-hidden">
            <div className="flex h-full justify-between">
              <div
                className={cn("flex grow flex-col justify-between pt-8", {
                  "pt-0": !!reduceTopPadding,
                })}
              >
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
                    <div className="flex-1 overflow-y-scroll">{children}</div>
                  </div>
                </div>

                {footer !== undefined && (
                  <div className="ml-auto mt-3 shrink-0 grow-0">{footer}</div>
                )}
              </div>
              {sidebar !== undefined && (
                <div
                  className={cn(
                    "ml-3 h-full shrink-0 overflow-y-scroll border-l border-app-border px-3 pb-3 pl-5 pt-12",
                    sidebarClassName,
                  )}
                >
                  {sidebar}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={dismiss}
            className={cn("absolute right-5 top-3 text-3xl text-gray-600", {
              "top-5": !!reduceTopPadding,
            })}
          >
            <CloseIcon fontSize="inherit" />
          </button>
        </div>
      </PopupContext.Provider>
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

export const usePopupContainer = () => {
  const context = useContext(PopupContext);
  return context;
};

interface SidebarPopupProps {
  show: boolean;
  dismiss: () => void;
  disablePassiveDismiss?: boolean;
  showEdit?: boolean;
}

export function SidebarPopup({
  children,
  show,
  dismiss,
  disablePassiveDismiss,
  showEdit,
}: SidebarPopupProps & PropsWithChildren) {
  const [slideIn, setSlideIn] = useState(false);

  useEffect(() => {
    if (show) {
      setSlideIn(true);
    } else {
      const timeout = setTimeout(() => setSlideIn(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  return (
    (show || slideIn) && (
      <>
        <div
          className={cn(
            "absolute left-0 top-0 z-10 h-full w-full bg-black opacity-0 transition duration-200",
            {
              "opacity-30": show && slideIn,
            },
          )}
          onClick={(e) => {
            if (!disablePassiveDismiss) dismiss();
            e.stopPropagation();
          }}
        ></div>
        <div
          className={cn(
            "absolute right-0 top-0 z-[11] h-full w-1/2 translate-x-full bg-white p-5 pt-12 shadow-md transition duration-200",
            {
              "translate-x-0": show && slideIn,
            },
          )}
        >
          <div className="flex grow justify-between overflow-y-hidden">
            <div className="flex-1 overflow-y-scroll p-2">{children}</div>
            {showEdit && (
              <div className="flex shrink-0 flex-col gap-2">
                <button className="text-3xl text-gray-600">
                  <EditIcon fontSize="inherit" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={dismiss}
            className="absolute right-5 top-3 text-3xl text-gray-600"
          >
            <CloseIcon fontSize="inherit" />
          </button>
        </div>
      </>
    )
  );
}
