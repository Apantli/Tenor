import React, { useEffect, useState } from "react";
import useStutterLoading from "~/app/_hooks/useStutterLoading";
import LoadingGhostTableRow from "./LoadingGhostTableRow";
import { cn } from "~/lib/helpers/utils";
import useAfterResize from "~/app/_hooks/useAfterResize";

interface Props {
  multiselect?: boolean;
  timeEstimate?: number;
  ghostRows: number;
  finishedLoading: boolean;
  rowClassName?: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export default function LoadingGhostTableRows({
  timeEstimate,
  ghostRows,
  multiselect,
  finishedLoading,
  rowClassName,
  scrollContainerRef,
}: Props) {
  const [progress, setProgress] = useState(0);
  const [hide, setHide] = useState(false);
  const [width, setWidth] = useState<number | null>(null);

  // Increase the time estimate for each ghost row
  const actualEstimate = (timeEstimate ?? 2000) + (ghostRows - 1) * 800;

  const finishLoading = useStutterLoading({
    duration: actualEstimate,
    hangAt: 90,
    update(pct) {
      setProgress(pct);
    },
  });

  useEffect(() => {
    if (finishedLoading) {
      finishLoading();

      const timeout = setTimeout(() => {
        setHide(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [finishedLoading]);

  useEffect(() => {
    setWidth(scrollContainerRef?.current?.children[0]?.clientWidth ?? null);
  }, [scrollContainerRef?.current?.children[0]?.clientWidth]);

  useAfterResize(() => {
    setWidth(scrollContainerRef?.current?.children[0]?.clientWidth ?? null);
  });

  const ghostRowIds = Array.from({ length: ghostRows }, (_, index) => index);

  return (
    <div
      className={cn("transition-all duration-500", {
        "opacity-0": hide,
        "pointer-events-none absolute left-0 top-0 z-10 h-full w-full":
          finishedLoading,
      })}
      style={{
        width: width ? `${width}px` : "100%",
      }}
    >
      {ghostRowIds.map((value) => (
        <LoadingGhostTableRow
          key={value}
          multiselect={multiselect}
          progress={progress}
          className={rowClassName}
          scrollContainerRef={scrollContainerRef}
        />
      ))}
    </div>
  );
}
