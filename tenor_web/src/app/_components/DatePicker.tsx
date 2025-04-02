import React, { useState, useEffect, useRef } from 'react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';

interface DatePickerProps {
  onChange: (date: Date | null) => void;
  selectedDate?: Date | null;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  onChange,
  selectedDate = null,
  className = '',
  placeholder = 'No date'
}: DatePickerProps) {
  const [date, setDate] = useState<Date | null>(selectedDate);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  useEffect(() => {
    if (selectedDate !== date) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      setDate(null);
      onChange(null);
      return;
    }
    
    const newDate = new Date(`${e.target.value}T12:00:00`);
    setDate(newDate);
    onChange(newDate);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(null);
    onChange(null);
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between bg-gray-100 hover:bg-gray-200 rounded-lg p-2 relative">
        <CalendarMonthIcon 
          className="w-5 h-5 text-gray-700 mr-2 cursor-pointer" 
          onClick={openDatePicker}
        />
        <div className="flex flex-grow items-center" onClick={openDatePicker}>
          <div className="cursor-pointer text-gray-700 font-medium">
            {date ? formatDate(date) : placeholder}
          </div>
          <input
            ref={dateInputRef}
            type="date"
            className="absolute opacity-0 w-0 h-0"
            value={date ? date.toISOString().split('T')[0] : ''}
            onChange={handleDateChange}
          />
        </div>
        {date && (
          <button 
            onClick={handleClear}
            className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}


