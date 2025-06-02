import { cn } from "~/lib/helpers/utils";

export default function ProgressBar({
  min,
  max,
  value,
  progressBarColor,
  emptyBarColor,
  displayValue,
  className,
  compact = false,
  hidePercentageText = false,
}: {
  min: number;
  max: number;
  value: number;
  progressBarColor: string;
  emptyBarColor: string;
  displayValue?: string;
  className?: string;
  compact?: boolean;
  hidePercentageText?: boolean;
}) {
  let percentage;

  if (min < 0 || max <= min || value < min || value > max) {
    percentage = 0;
  } else {
    percentage = (((value - min) / (max - min)) * 100).toFixed(0);
  }

  const customStyles = {
    backgroundColor: progressBarColor,
    emptyBarColor: emptyBarColor,
    displayValue: displayValue,
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-lg dark:bg-gray-700",
        compact ? "h-8" : "h-[49px]",
        className,
      )}
      style={{ backgroundColor: customStyles.emptyBarColor }}
    >
      <div
        className="h-full rounded-lg"
        style={{
          width: `${percentage}%`,
          backgroundColor: customStyles.backgroundColor,
        }}
      />
      {!hidePercentageText && !compact && (
        <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-start">
          <span className="px-5 text-white">
            {percentage}% {customStyles.displayValue}
          </span>
        </div>
      )}
      {!hidePercentageText && compact && (
        <div className="absolute inset-0 flex items-center px-3">
          <span className="text-sm font-medium text-white">{percentage}%</span>
        </div>
      )}
    </div>
  );
}
