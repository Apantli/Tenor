import { Class } from "node_modules/superjson/dist/types";
import React, { useRef } from "react";
import { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import DescriptionIcon from "@mui/icons-material/Description";
import PrimaryButton from "../buttons/PrimaryButton";

interface Props {
  label: string;
  files: File[];
  className?: ClassNameValue;
  handleFileAdd: (files: File[]) => void;
  handleFileRemove: (file: File) => void;
}

export default function FileList({
  label,
  className,
  files,
  handleFileAdd,
  handleFileRemove,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <label className="text-sm font-semibold">{label}</label>

        <div>
          <PrimaryButton
            onClick={openFilePicker}
            className="max-h-[40px] text-sm font-semibold"
          >
            Add Context File +
          </PrimaryButton>

          <input
            type="file"
            accept=".pdf, .txt, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                const fileArray = Array.from(files);
                handleFileAdd(fileArray);
              }
            }}
            multiple
          />
        </div>
      </div>

      <ul
        className={cn(
          "flex h-[100px] w-full list-none gap-4 overflow-x-auto rounded-md border border-gray-300 px-4 py-2 shadow-sm",
          className,
        )}
      >
        {files.map((file, index) => (
          <li
            key={index}
            className="h-[100px] flex-shrink-0"
            onClick={() => handleFileRemove(file)}
            title={file.name}
          >
            <span className="flex flex-col items-center text-gray-500 hover:text-blue-500">
              {/* Load Icon based on file type */}
              {file.type === "application/pdf" ? (
                <PictureAsPdfIcon style={{ fontSize: "4rem" }} />
              ) : file.type === "text/csv" ? (
                <TableChartIcon style={{ fontSize: "4rem" }} />
              ) : (
                <DescriptionIcon style={{ fontSize: "4rem" }} />
              )}

              {/* <PictureAsPdfIcon style={{ fontSize: '4rem' }} /> */}
              <span className="mt-1 max-w-[80px] truncate text-center text-xs">
                {file.name}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
