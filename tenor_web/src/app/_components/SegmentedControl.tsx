import React, { useState, useEffect, useRef } from 'react';

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
  className = ''
}: SegmentedControlProps) {
  const defaultOption = options.length > 0 ? options[0] : '';
  const [selected, setSelected] = useState<string>(selectedOption ?? defaultOption!)
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  
  const calculateIndicatorPosition = () => {
    const container = containerRef.current;
    if (!container) return;
    
    const activeButton = container.querySelector(`[data-value="${selected}"]`);
    if (!activeButton) return;
    
    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    
    setIndicatorStyle({
      left: buttonRect.left - containerRect.left,
      width: buttonRect.width
    });
  };
  
  useEffect(() => {
    calculateIndicatorPosition();
    window.addEventListener('resize', calculateIndicatorPosition);
    
    return () => window.removeEventListener('resize', calculateIndicatorPosition);
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
  
  return (
    <div 
      ref={containerRef}
      className={`relative flex rounded-lg bg-gray-100 p-1 ${className}`}
    >
      {/* Animated selector background */}
      <div 
        className="absolute bg-app-primary rounded-md transition-all duration-300 ease-in-out"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          height: 'calc(100% - 0.5rem)',
          top: '0.25rem'
        }}
      />
      
      {/* Option buttons */}
      {options.map((option) => (
        <button
          key={option}
          data-value={option}
          onClick={() => handleChange(option)}
          className={`relative z-10 py-2 px-4 rounded-md font-medium transition-colors duration-300 flex-1 text-center ${
            selected === option ? 'text-white' : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}