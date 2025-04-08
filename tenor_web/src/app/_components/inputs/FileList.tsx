import React, { useRef } from "react";
import { type ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import DescriptionIcon from "@mui/icons-material/Description";
import PrimaryButton from "../buttons/PrimaryButton";
import { useAlert } from "~/app/_hooks/useAlert";

interface Props {
  label: string;
  files: File[];
  memoryLimit: number;
  className?: ClassNameValue;
  handleFileAdd: (files: File[]) => void;
  handleFileRemove: (file: File) => void;
}

export default function FileList({
  label,
  className,
  files,
  memoryLimit,
  handleFileAdd,
  handleFileRemove,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  function filesSumSize() {
    return files.reduce((total, item) => total + item.size, 0);
  }

  const { alert } = useAlert();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div>
          <label className="text-sm font-semibold">{label}</label>
          <span className="ml-2 text-xs text-gray-500">
            {(filesSumSize() / 1_000_000).toFixed(1)}
            MB / {(memoryLimit / 1_000_000).toFixed(1)}MB
          </span>
        </div>

        <div>
          <PrimaryButton
            onClick={openFilePicker}
            className="flex max-h-[40px] items-center text-sm font-semibold"
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
              if (!files) return;

              const fileArray = Array.from(files);
              const filesSize = fileArray.reduce(
                (total, file) => total + file.size,
                0,
              );

              if (filesSumSize() + filesSize > memoryLimit) {
                alert("Oops...", "You exceeded the file size limit.", {
                  type: "error",
                  duration: 5000, // time in ms (5 seconds)
                });
                return;
              }

              handleFileAdd(fileArray);
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
            <span
              className="flex flex-col items-center text-gray-500 hover:text-blue-500"
              data-tooltip-id="tooltip"
              data-tooltip-content={file.name}
            >
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
