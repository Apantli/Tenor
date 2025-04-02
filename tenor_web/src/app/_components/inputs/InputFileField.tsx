import React from "react";
import { cn } from "~/lib/utils";
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';

interface Props {
  label: string;
  image: File | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InputFileField({ label, id, className, handleImageChange, image, ...props }: Props & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
        <label htmlFor={id} className="text-sm font-semibold" >
        {label}
        </label>
        
        <label className = {cn("block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ", className)}>

        <div className="flex">
          <DriveFolderUploadIcon />
          <span className="pl-2 block max-w-[200px] truncate text-sm text-gray-700">
            {image?.name ?? "Attach Image"}
          </span>
        </div>

        <input
            id={id}
            type="file"
            className="hidden"
            onChange={handleImageChange}
            {...props}
        />
        </label>
    </div>
  );
}
