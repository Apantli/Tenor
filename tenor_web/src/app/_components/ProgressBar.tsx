export function ProgressBar({
  min,
  max,
  value,
  progressBarColor,
  emptyBarColor,
  displayValue,
}: {
  min: number;
  max: number;
  value: number;
  progressBarColor: string;
  emptyBarColor: string;
  displayValue?: string;
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
      className={`relative h-[49px] w-full rounded-lg dark:bg-gray-700`}
      style={{ backgroundColor: customStyles.emptyBarColor }}
    >
      <div
        className={`h-full rounded-lg`}
        style={{
          width: `${percentage}%`,
          backgroundColor: customStyles.backgroundColor,
        }}
      ></div>
      <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-start">
        <span className="px-5 text-white">
          {percentage}% {customStyles.displayValue}
        </span>
      </div>
    </div>
  );
}

export default ProgressBar;
