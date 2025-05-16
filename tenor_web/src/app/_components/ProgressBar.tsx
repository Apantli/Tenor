function ProgressBar({ 
  min, 
  max, 
  value,
  progressBarColor,
  emptyBarColor,
  displayValue,
 }: { 
  min: number; 
  max: number; 
  value: number, 
  progressBarColor: string, 
  emptyBarColor: string,
  displayValue: string }) 
  {
  const percentage = ((value - min) / (max - min)) * 100;
  const customStyles = {
    backgroundColor: progressBarColor,
    emptyBarColor: emptyBarColor,
    displayValue: displayValue,
  };

  return (
    <div className={`w-full rounded-lg relative dark:bg-gray-700 h-[39px]`} style={{ backgroundColor: customStyles.emptyBarColor }}>  
      <div
        className={`h-[39px] rounded-lg`}
        style={{ width: `${percentage}%`, backgroundColor: customStyles.backgroundColor}}
      ></div>
      <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-start">
        <span className="text-white px-4">{customStyles.displayValue} {percentage}%</span>
      </div>
    </div>
  );
}

export default ProgressBar;