import { cn } from "~/lib/utils";
import React, { useRef } from "react";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";

interface Props {
  label: string;
  image: File | null;
  handleImageChange: (file: File) => void;
}

export default function InputFileField({
  label,
  id,
  className,
  handleImageChange,
  image,
  ...props
}: Props & React.InputHTMLAttributes<HTMLInputElement>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>

      <div
        className={cn(
          "flex h-full w-full items-center rounded-md border border-gray-300 px-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
          className,
        )}
      >
        <div className="flex h-10 items-center py-2" onClick={openFilePicker}>
          {/* Show file thumbnail */}
          <div>
            {(image && (
              <img
                src={URL.createObjectURL(image)}
                alt="Selected"
                className="h-10 w-10 rounded-full object-cover"
              />
            )) ?? <DriveFolderUploadIcon />}
          </div>
          <span className="flex h-10 max-w-[200px] items-center truncate pl-2 text-sm text-gray-700">
            {image?.name ?? "Attach Image"}
          </span>
        </div>

        <input
          id={id}
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImageChange(file);
            }
          }}
          {...props}
        />
      </div>
    </div>
  );
}
