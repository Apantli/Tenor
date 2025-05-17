import React, { useEffect, useRef, useState } from "react";
import { type Alert } from "../_hooks/useAlert";
import { cn } from "~/lib/utils";
import useShiftKey from "../_hooks/useShiftKey";

interface Props {
  alertItem: Alert;
  removeAlert: (id: number) => void;
  alertCount: number;
  removeAll: () => void;
}

export default function AlertComponent({
  alertItem,
  removeAlert,
  alertCount,
  removeAll,
}: Props) {
  const [countdown, setCountdown] = useState(alertItem.options.duration);
  const animationFrameRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const shiftPressed = useShiftKey();

  useEffect(() => {
    if (countdown === undefined) return;

    let startTime: number;
    const tick = (timestamp: number) => {
      if (alertItem.options.duration === undefined) return;

      if (!startTime || isHovered) {
        startTime = timestamp;
      }

      const elapsedTime = timestamp - startTime;
      const remainingTime = Math.max(
        alertItem.options.duration - elapsedTime,
        0,
      );
      setCountdown(remainingTime);

      if (remainingTime > 0) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else if (remainingTime == 0) {
        removeAlert(alertItem.id);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered]);

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

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={cn("relative translate-x-0 transition ease-in", {
        "translate-x-[450px] opacity-0": !alertItem.show,
        "translate-y-[calc(100%+20px)]": alertItem.enter,
      })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-cy="alert-component"
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
        className={cn(
          `absolute bottom-0 left-0 h-2 w-full rounded-b-lg ${lineColors[alertItem.options.type]}`,
          {
            "opacity-20": alertItem.options.duration != undefined,
          },
        )}
      ></div>
      {alertItem.options.duration && countdown !== undefined && (
        <div
          className={cn("absolute bottom-0 left-0 overflow-hidden", {
            "transition-all": isHovered,
          })}
          style={{
            width: `${(countdown * 100) / alertItem.options.duration}%`,
          }}
        >
          <div
            className={`h-2 w-96 rounded-b-lg ${lineColors[alertItem.options.type]}`}
          ></div>
        </div>
      )}

      <button
        className="absolute right-3 top-3 flex h-8 w-auto items-center justify-center rounded-lg border border-transparent px-2 text-3xl font-thin transition-all hover:border-app-border"
        onClick={(e) => {
          if (e.shiftKey) {
            removeAll();
          } else {
            removeAlert(alertItem.id);
          }
        }}
        data-tooltip-id="tooltip"
        data-tooltip-content="Shift+Click to dismiss all"
        data-tooltip-place="top-start"
        data-tooltip-hidden={alertCount == 1 || shiftPressed}
      >
        {isHovered && shiftPressed && alertCount > 1 ? (
          <span className="text-xs font-medium">Dismiss all</span>
        ) : (
          <span>&times;</span>
        )}
      </button>
    </div>
  );
}
