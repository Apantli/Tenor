import React, { useState, useEffect, useRef } from 'react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
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

  useEffect(() => {
    if (selectedDate !== date) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
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
        <CalendarTodayIcon 
          className="w-5 h-5 text-gray-700 mr-2 cursor-pointer" 
          onClick={openDatePicker}
        />
        <input
          ref={dateInputRef}
          type="date"
          className="bg-transparent border-none focus:outline-none text-gray-700 font-medium w-full cursor-pointer appearance-none"
          value={date ? date.toISOString().split('T')[0] : ''}
          onChange={handleDateChange}
          placeholder={placeholder}
        />
        {date && (
          <button 
            onClick={handleClear}
            className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}


