"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

interface SegmentedControlProps {
  options: string[];
  selectedOption?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  selectedOption,
  onChange,
  className = "",
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
      left: buttonRect.left - containerRect.left,
      width: buttonRect.width,
    });
  };

  useEffect(() => {
    calculateIndicatorPosition();
    window.addEventListener("resize", calculateIndicatorPosition);

    return () =>
      window.removeEventListener("resize", calculateIndicatorPosition);
  }, [selected, options]);

  useEffect(() => {
    if (selectedOption && selected !== selectedOption) {
      setSelected(selectedOption);
    }
  }, [selectedOption, selected]);

  const handleChange = (option: string) => {
    setSelected(option);
    onChange(option);
  };

  // Wait for the component to mount before starting the animation
  useEffect(() => {
    setTimeout(() => {
      setAnimationActive(true);
    }, 100);
  }, []);

  // TODO: Make this be the same size as a button (or maybe leave as is, I need second opinion)
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex rounded-lg bg-sprint-column-background p-1",
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
          onClick={() => handleChange(option)}
          className={`relative z-10 flex-1 rounded-md px-4 py-2 text-center font-medium transition-colors duration-300 ${
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
