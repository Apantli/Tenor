import React, { useRef, useState, useEffect } from 'react';
import { cn } from '~/lib/utils';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

export interface Option {
  id: string | number;
  name: string;
  image: string;
}

interface EditableBoxProps {
  options: Option[];
  selectedOption?: Option | null;
  onChange: (option: Option | null) => void;
  className?: string;
  placeholder?: string;
}

export function EditableBox({
  options,
  selectedOption = null,
  onChange,
  className,
  placeholder = 'Select an option'
}: EditableBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option => 
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && searchInputRef.current) {
      // Focus search input when opening dropdown
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Selected option display / Trigger button */}
      <div 
        className={cn(
          'flex items-center justify-between rounded-lg border border-gray-300 p-2 relative cursor-pointer',
          'hover:bg-gray-200 transition-colors'
        )}
        onClick={toggleDropdown}
      >
        {selectedOption ? (
          <>
            <div className="flex items-center flex-grow">
              <img 
                src={selectedOption.image} 
                alt={selectedOption.name} 
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="text-gray-700 font-medium">{selectedOption.name}</span>
            </div>
            <button 
              onClick={handleClear}
              className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <span className="text-gray-700 font-medium">{placeholder}</span>
            <ArrowDropDownIcon className="w-5 h-5 text-gray-700" />
          </>
        )}
      </div>

      {/* Dropdown content */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-300">
          {/* Search box */}
          <div className="p-2 border-b border-gray-200">
            <div className="flex items-center bg-gray-100 rounded-md px-2">
              <SearchIcon className="text-gray-500 w-5 h-5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="bg-transparent py-2 px-2 w-full outline-none"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelect(option)}
                >
                  <img 
                    src={option.image} 
                    alt={option.name} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span>{option.name}</span>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}