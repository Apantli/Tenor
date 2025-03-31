"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/EditOutlined";

interface Props {
  show: boolean;
  size: "small" | "large";
  dismiss: () => void;
  footer?: React.ReactNode;
  disablePassiveDismiss?: boolean;
  sidebar?: React.ReactNode;
  showEdit?: boolean;
  reduceTopPadding?: boolean;
  zIndex?: number;
}

export default function Popup({
  show,
  size,
  dismiss,
  children,
  footer,
  disablePassiveDismiss,
  sidebar,
  showEdit,
  reduceTopPadding,
  zIndex,
}: Props & PropsWithChildren) {
  const [popIn, setPopIn] = useState(false);

  useEffect(() => {
    if (show) {
      setPopIn(true);
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
      <>
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
          )}
          style={{ zIndex: (zIndex ?? 100) + 1 }}
        >
          <div className="grow justify-between gap-4 overflow-y-hidden">
            <div className="flex h-full justify-between">
              <div
                className={cn("flex grow flex-col justify-between pt-10", {
                  "pt-0": !!reduceTopPadding,
                })}
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

                {footer !== undefined && (
                  <div className="ml-auto mt-3 shrink-0 grow-0">{footer}</div>
                )}
              </div>
              {sidebar !== undefined && (
                <div className="ml-3 h-full grow-0 border-l border-app-border px-3 pb-3 pt-12">
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
      </>
    )
  );
}

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
