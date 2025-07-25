import React, { useEffect, useRef } from "react";
import AiIcon from "@mui/icons-material/AutoAwesome";
import BubbleIcon from "@mui/icons-material/BubbleChart";
import { cn } from "~/lib/helpers/utils";

interface LoadingGhostTableRowProps<> {
  multiselect?: boolean;
  progress: number;
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

function LoadingGhostTableRow({
  multiselect,
  progress,
  className,
  scrollContainerRef,
}: LoadingGhostTableRowProps) {
  const gridTemplateColumns = (multiselect ? "20px " : "") + " 40px 1fr";

  const width = scrollContainerRef?.current?.clientWidth;

  const randomStarPosition = () => {
    const x = Math.random() * -window.innerWidth;
    const y = Math.random() * 20;
    const initialY = Math.random() * 20;
    const speed = Math.random() * 8 + 3;
    const rotation = Math.random() * 360;
    return { x, y, initialY, speed, rotation };
  };

  const initialPositions = [];
  for (let i = 0; i < 10; i++) {
    initialPositions.push(randomStarPosition());
  }
  const starPositions = useRef(initialPositions);
  const starContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;

    function step(time: number) {
      starPositions.current = starPositions.current.map((pos) => {
        const newX = pos.x + pos.speed;
        const newY = pos.initialY + Math.sin((time / 1000) * pos.speed) * 10;
        if (newX > window.innerWidth) {
          return randomStarPosition();
        }
        return { ...pos, x: newX, y: newY };
      });

      if (starContainerRef.current) {
        for (let i = 0; i < starPositions.current.length; i++) {
          const pos = starPositions.current[i];
          const star = starContainerRef.current.children[i] as HTMLDivElement;
          if (star && pos) {
            star.style.top = `${pos.y}px`;
            star.style.left = `${pos.x}px`;
            star.style.transform = `rotate(${pos.rotation}deg)`;
          }
        }
      }

      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      className={cn(
        "sticky left-0 grid min-w-fit origin-top items-center gap-3 overflow-hidden rounded-lg border-b border-white bg-app-secondary p-2 transition-all",
        className,
      )}
      style={{ gridTemplateColumns, width: width ? `${width}px` : "100%" }}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 z-0 h-full overflow-hidden bg-app-primary transition-all duration-500 ease-in-out"
        style={{ width: `${progress}%` }}
      >
        {/* Background animation */}
        <div className="absolute z-[5] h-full w-full" ref={starContainerRef}>
          {starPositions.current.map((pos, i) => (
            <div
              className="absolute z-[5] flex rotate-45 animate-pulse items-center justify-center text-[15px] text-white opacity-30"
              style={{
                top: `${pos.y}px`,
                left: `${pos.x}px`,
              }}
              key={i}
            >
              <BubbleIcon fontSize="inherit" />
            </div>
          ))}
        </div>
      </div>
      {multiselect && <div></div>}
      <div className="z-10 flex animate-pulse items-center justify-start">
        <AiIcon fontSize="small" htmlColor="white" />
      </div>
      <div className="animate-shimmer z-10 w-fit">Generating...</div>
    </div>
  );
}

export default LoadingGhostTableRow;
