"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "~/lib/helpers/utils";

interface SegmentedControlProps {
  options: string[];
  selectedOption?: string;
  onChange: (value: string) => void;
  className?: string;
  dontAnimateAlways?: boolean;
}

export function SegmentedControl({
  options,
  selectedOption,
  onChange,
  className = "",
  dontAnimateAlways = false,
}: SegmentedControlProps) {
  const defaultOption = options.length > 0 ? options[0] : "";
  const [selected, setSelected] = useState<string>(
    selectedOption ?? defaultOption!,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [animationActive, setAnimationActive] = useState(false);

  const calculateIndicatorPosition = () => {
    const container = containerRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-value="${selected}"]`);
    if (!activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setIndicatorStyle({
      left: buttonRect.left - containerRect.left + container.scrollLeft,
      width: buttonRect.width,
    });
  };

  useEffect(() => {
    calculateIndicatorPosition();

    // Recalculate the indicator position when the container ref resizes
    const resizeObserver = new ResizeObserver(() => {
      calculateIndicatorPosition();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [containerRef.current, selected]);

  useEffect(() => {
    if (selectedOption && selected !== selectedOption) {
      setSelected(selectedOption);
    }
  }, [selectedOption, selected]);

  // Allow the animation only after the component mounts
  useEffect(() => {
    if (!dontAnimateAlways) {
      setTimeout(() => {
        setAnimationActive(true);
      }, 10);
    }
  });

  const handleChange = (option: string) => {
    setSelected(option);
    onChange(option);
    if (dontAnimateAlways) {
      setAnimationActive(true);
      setTimeout(() => {
        setAnimationActive(false);
      }, 200);
    }
  };

  // TODO: Make this be the same size as a button (or maybe leave as is, I need second opinion)
  return (
    <div
      ref={containerRef}
      className={cn(
        "no-scrollbar relative flex overflow-x-auto rounded-lg bg-sprint-column-background p-1",
        className,
      )}
      data-cy="segmented-control"
    >
      {/* Animated selector background */}
      <div
        className={cn(
          "absolute rounded-md bg-app-primary transition-none duration-300 ease-in-out",
          {
            "transition-all": animationActive,
          },
        )}
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          height: "calc(100% - 0.5rem)",
          top: "0.25rem",
        }}
      />
      {/* Option buttons for each option */}
      {options.map((option) => (
        <button
          key={option}
          data-value={option}
          onClick={(e) => {
            handleChange(option);
            const target = e.currentTarget as HTMLButtonElement;
            target.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }}
          className={`relative z-10 flex-1 whitespace-nowrap rounded-md px-4 py-2 text-center font-medium transition-colors duration-300 ${
            selected === option
              ? "text-white"
              : "text-gray-700 hover:text-gray-900"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
