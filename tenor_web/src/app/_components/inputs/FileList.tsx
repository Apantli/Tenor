import { Class } from "node_modules/superjson/dist/types";
import React, { useRef } from "react";
import { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import PrimaryButton from "../PrimaryButton";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import DescriptionIcon from '@mui/icons-material/Description';



interface Props {
  label: string;
  files: File[];
  className?: ClassNameValue;
  handleFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileRemove: (file: File) => void;
}

export default function FileList({ label, className, files, handleFilesChange, handleFileRemove }: Props) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

  return (
    <div className="w-full">
        <div className="flex justify-between items-center py-4">
            <label className="text-sm font-semibold" >
            {label}
            </label>

            <div>
                <PrimaryButton
                    onClick={openFilePicker}
                    className="text-sm font-semibold max-h-[40px]"
                >
                    Add Context File +
                </PrimaryButton>

                <input
                    type="file"
                    accept=".pdf, .txt, .csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFilesChange}
                    multiple
                />
            </div>
        </div>
        
        <ul
        className={cn(
            "h-[100px] flex gap-4 overflow-x-auto list-none w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm",
            className
        )}
        >
        {files.map((file, index) => (
            <li key={index} className="flex-shrink-0 h-[100px]"
            onClick={() => handleFileRemove(file)}
            title={file.name}
            >
            <span
                className="flex flex-col items-center text-gray-500 hover:text-blue-500"
            >
                {/* Load Icon based on file type */}
                {file.type === "application/pdf" ? (
                <PictureAsPdfIcon style={{ fontSize: '4rem' }} />
                ) : file.type === "text/csv" ? (
                <TableChartIcon style={{ fontSize: '4rem' }} />
                ) : (
                <DescriptionIcon style={{ fontSize: '4rem' }} />
                )}
                

                {/* <PictureAsPdfIcon style={{ fontSize: '4rem' }} /> */}
                <span className="text-xs mt-1 truncate max-w-[80px] text-center">
                {file.name}
                </span>
            </span>
            </li>
        ))}
        </ul>

    </div>
  );
}
