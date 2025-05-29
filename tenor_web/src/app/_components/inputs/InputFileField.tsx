import { cn } from "~/lib/helpers/utils";
import React, { useRef } from "react";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";

interface Props {
  label: string;
  image: File | null;
  labelClassName?: string;
  containerClassName?: string;
  handleImageChange: (file: File) => void;
  displayText?: string;
  imagePreview?: boolean;
}

export default function InputFileField({
  label,
  id,
  className,
  containerClassName,
  labelClassName,
  handleImageChange,
  imagePreview,
  image,
  displayText = "Attach Image",
  ...props
}: Props & React.InputHTMLAttributes<HTMLInputElement>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("w-full", containerClassName)} onClick={openFilePicker}>
      <label
        htmlFor={id}
        className={cn("text-sm font-semibold", labelClassName)}
      >
        {label}
      </label>

      <div
        className={cn(
          "flex h-full w-full cursor-pointer items-center rounded-md border border-gray-300 px-4 shadow-sm transition hover:bg-app-hover-border focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
          className,
        )}
      >
        <div className="flex h-10 items-center py-2">
          {/* Show file thumbnail */}
          <div>
            {(image && imagePreview && (
              <img
                src={URL.createObjectURL(image)}
                alt="Selected"
                className="h-10 w-10 rounded-full object-cover"
              />
            )) ?? <DriveFolderUploadIcon />}
          </div>
          <span className="flex h-10 max-w-[200px] items-center truncate pl-2 text-sm text-gray-700">
            {image?.name ?? displayText}
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
