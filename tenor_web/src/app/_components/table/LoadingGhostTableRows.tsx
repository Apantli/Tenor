import React, { useEffect, useState } from "react";
import useStutterLoading from "~/app/_hooks/useStutterLoading";
import LoadingGhostTableRow from "./LoadingGhostTableRow";
import type { DeleteOptions, TableOptions } from "./Table";
import { cn } from "~/lib/utils";

interface Props<I> {
  multiselect?: boolean;
  extraOptions?: TableOptions<I>[];
  deletable?: boolean | DeleteOptions;
  columnWidths: number[];
  timeEstimate?: number;
  ghostRows: number;
  finishedLoading: boolean;
  rowClassName?: string;
}

export default function LoadingGhostTableRows<I extends string | number>({
  timeEstimate,
  ghostRows,
  multiselect,
  extraOptions,
  deletable,
  columnWidths,
  finishedLoading,
  rowClassName,
}: Props<I>) {
  const [progress, setProgress] = useState(0);
  const [hide, setHide] = useState(false);

  const finishLoading = useStutterLoading({
    duration: timeEstimate ?? 2000,
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

  const ghostRowIds = Array.from({ length: ghostRows }, (_, index) => index);

  return (
    <div
      className={cn("transition-all duration-500", {
        "opacity-0": hide,
        "pointer-events-none absolute left-0 top-0 z-10 h-full w-full":
          finishedLoading,
      })}
    >
      {ghostRowIds.map((value) => (
        <LoadingGhostTableRow
          key={value}
          columnWidths={columnWidths}
          extraOptions={extraOptions}
          deletable={deletable}
          multiselect={multiselect}
          progress={progress}
          className={rowClassName}
        />
      ))}
    </div>
  );
}
