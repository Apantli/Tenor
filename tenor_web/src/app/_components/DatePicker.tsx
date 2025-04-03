import React, { useRef } from 'react';
import { cn } from "~/lib/utils";
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
  className,
  placeholder = 'No date'
}: DatePickerProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      onChange(null);
      return;
    }
    const newDate = new Date(`${e.target.value}T12:00:00`);
    onChange(newDate);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className= 'flex items-center justify-between rounded-lg border border-gray-300 p-2 hover:bg-gray-200 transition-colors'>
        <CalendarMonthIcon 
          className="w-5 h-5 text-gray-700 mr-2 cursor-pointer" 
          onClick={openDatePicker}
        />
        <div className="flex flex-grow items-center" onClick={openDatePicker}>
          <div className="cursor-pointer text-gray-700 font-medium">
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </div>
          <input
            ref={dateInputRef}
            type="date"
            className="absolute opacity-0 w-0 h-0"
            value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
            onChange={handleDateChange}
          />
        </div>
        {selectedDate && (
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


