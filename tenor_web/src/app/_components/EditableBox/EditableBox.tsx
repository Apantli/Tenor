"use client";

import React, { useState } from 'react';
import { cn } from '~/lib/utils';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';
import Dropdown, { DropdownItem, DropdownButton } from '../Dropdown';
import ProfilePicture from '../ProfilePicture';
import { type User } from 'firebase/auth';

export interface Option {
  id: string | number | null;
  name: string;
  image?: string;
  user?: User | null;
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
  placeholder = 'Select an option',
}: EditableBoxProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option => 
    option.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    onChange(option);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  const renderDropdownLabel = () => {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-300 p-2 relative cursor-pointer hover:bg-gray-200 transition-colors w-full h-10">
        {selectedOption ? (
          <>
            <div className="flex items-center flex-grow gap-2">
              {selectedOption.user ? (
                <ProfilePicture user={selectedOption.user} hideTooltip />
              ) : selectedOption.image ? (
                <img 
                  src={selectedOption.image} 
                  alt={selectedOption.name} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-500">
                    {selectedOption.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-gray-700 font-medium">{selectedOption.name}</span>
            </div>
            <div 
              onClick={handleClear}
              className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </div>
          </>
        ) : (
          <>
            <span className="text-gray-700 font-medium">{placeholder}</span>
            <ArrowDropDownIcon className="w-5 h-5 text-gray-700" />
          </>
        )}
      </div>
    );
  };

  const createOption = (option: Option) => {
    return (
      <DropdownButton
        onClick={() => handleSelect(option)}
        className="flex items-center gap-2 border-b border-app-border px-2 py-2 last:border-none"
        key={option.id}
      >
        {option.user ? (
          <ProfilePicture user={option.user} hideTooltip />
        ) : option.image ? (
          <img
            src={option.image}
            alt={option.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
            {/* Perhaps is better to just show the name if there is no image, I added this because is better in case just one element has an image an others don't */}
            <span className="text-sm font-medium text-gray-500">
              {option.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span>{option.name}</span>
      </DropdownButton>
    );
  };
  
  // Perhaps apply cn in renderDropdownLabel instead of here to make it cleaner
  return (
    <div className={cn('w-full', className)}>
      <Dropdown label={renderDropdownLabel()} >
        <DropdownItem className="flex w-full flex-col">
          <span className="mb-2 text-sm text-gray-500">Select a person</span>
          <input
            type="text"
            className="mb-1 w-full rounded-md border border-app-border px-2 py-1 text-sm outline-none"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </DropdownItem>
        <div className="whitespace-nowrap text-left w-full">
          <div className="flex max-h-40 flex-col overflow-y-scroll rounded-b-lg">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => createOption(option))
            ) : (
              <span className="w-full px-2 py-1 text-sm text-gray-500">
                No options found
              </span>
           )}
          </div>
        </div>
      </Dropdown>
    </div>
  );
}

