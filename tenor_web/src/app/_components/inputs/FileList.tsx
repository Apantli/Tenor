import React, { useRef, useState, useCallback } from "react";
import { type ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/helpers/utils";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import DescriptionIcon from "@mui/icons-material/Description";
import { useAlert } from "~/app/_hooks/useAlert";
import useConfirmation from "~/app/_hooks/useConfirmation";
import CloseIcon from "@mui/icons-material/Cancel";
import PrimaryButton from "./buttons/PrimaryButton";
import { toBase64 } from "~/lib/helpers/base64";
import HelpIcon from "@mui/icons-material/Help";

import type { FileWithTokens } from "~/lib/types/firebaseSchemas";

interface Props {
  label: string;
  files: FileWithTokens[];
  tokenLimit: number;
  className?: ClassNameValue;
  handleFileAdd: (files: FileWithTokens[]) => void;
  handleFileRemove: (file: FileWithTokens) => void;
  labelClassName?: string;
  disabled?: boolean;
}

export default function FileList({
  label,
  className,
  files,
  tokenLimit = 200000,
  handleFileAdd,
  handleFileRemove,
  labelClassName,
  disabled = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  function filesTotalTokens() {
    return files.reduce((total, item) => total + (item.tokenCount ?? 0), 0);
  }

  const countTokensForText = useCallback(
    async (text: string): Promise<number> => {
      try {
        const response = await fetch("/api/token_count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error("Failed to count tokens");
        }

        const data = (await response.json()) as { tokenCount?: number };
        return data.tokenCount ?? 0;
      } catch (error) {
        console.error("Error counting tokens:", error);
        return 0;
      }
    },
    [],
  );

  const fetchTextFromFile = useCallback(
    async (base64: string): Promise<string> => {
      try {
        const response = await fetch("/api/file_text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base64 }),
        });

        if (!response.ok) {
          throw new Error("Failed to extract text from file");
        }

        const data = (await response.json()) as { text?: string };
        return data.text ?? "";
      } catch (error) {
        console.error("Error extracting text from file:", error);
        return "";
      }
    },
    [],
  );

  const processFiles = useCallback(
    async (fileArray: File[]): Promise<FileWithTokens[]> => {
      const processedFiles: FileWithTokens[] = [];

      for (const file of fileArray) {
        try {
          const base64 = (await toBase64(file)) as string;
          const textContent = await fetchTextFromFile(base64);
          const tokenCount = await countTokensForText(textContent);

          const fileWithTokens: FileWithTokens = Object.assign(file, {
            tokenCount,
          });
          processedFiles.push(fileWithTokens);
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          // Add file with 0 tokens if processing fails
          const fileWithTokens: FileWithTokens = Object.assign(file, {
            tokenCount: 0,
          });
          processedFiles.push(fileWithTokens);
        }
      }

      return processedFiles;
    },
    [countTokensForText, fetchTextFromFile],
  );

  const { predefinedAlerts } = useAlert();
  const confirm = useConfirmation();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div>
          <label className={cn("text-lg font-semibold", labelClassName)}>
            {label}
          </label>
          <span className="ml-2 text-sm text-gray-500">
            {isProcessing
              ? " (Processing...)"
              : ((filesTotalTokens() / tokenLimit) * 100)
                  .toFixed(2)
                  .toLocaleString() + "% storage used"}
          </span>
          <HelpIcon
            className="ml-2 text-gray-500"
            data-tooltip-id="tooltip"
            data-tooltip-content="Our AI models can process up to 200,000 tokens of context. We convert files to text and count tokens to ensure you stay within this limit."
            data-tooltip-place="top-start"
            style={{ width: "20px" }}
          />
        </div>

        <div>
          {!disabled && (
            <PrimaryButton
              onClick={openFilePicker}
              className="flex max-h-[40px] items-center"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Add Context File +"}
            </PrimaryButton>
          )}

          <input
            type="file"
            accept=".pdf, .txt, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={async (e) => {
              const files = e.target.files;
              if (!files || disabled || isProcessing) return;

              setIsProcessing(true);
              try {
                const fileArray = Array.from(files);
                const processedFiles = await processFiles(fileArray);

                const newTokens = processedFiles.reduce(
                  (total, file) => total + (file.tokenCount ?? 0),
                  0,
                );

                if (filesTotalTokens() + newTokens > tokenLimit) {
                  predefinedAlerts.fileLimitExceeded();
                  return;
                }

                handleFileAdd(processedFiles);
              } catch (error) {
                console.error("Error processing files:", error);
                predefinedAlerts.fileLimitExceeded();
              } finally {
                setIsProcessing(false);
              }
            }}
            multiple
          />
        </div>
      </div>

      <ul
        className={cn(
          "flex h-[120px] w-full list-none gap-4 overflow-x-auto overflow-y-hidden rounded-md border border-gray-300 px-4 py-2 shadow-sm",
          className,
        )}
      >
        {files.length === 0 && (
          <li className="flex h-full w-full text-gray-400">
            No files added yet...
          </li>
        )}
        {files.map((file, index) => (
          <li
            key={index}
            className="h-[100px] flex-shrink-0"
            onClick={async () => {
              if (disabled) return;
              if (
                !(await confirm(
                  "Are you sure you want to remove a file?",
                  `You are about to remove "${file.name}". This action is not reversible.`,
                  "Delete file",
                ))
              ) {
                return;
              }
              handleFileRemove(file);
            }}
          >
            <span
              className={cn(
                "group relative flex cursor-pointer flex-col items-center text-gray-500 transition",
                disabled ? "" : "hover:text-gray-500/50",
              )}
              data-tooltip-id="tooltip"
              data-tooltip-content={file.name}
            >
              {!disabled && (
                <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center pb-4 text-[40px] text-app-fail/90 opacity-0 transition group-hover:opacity-100">
                  <CloseIcon fontSize="inherit" />
                </div>
              )}
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
              <span className="text-[10px] text-gray-400">
                {(((file?.tokenCount ?? 0) / tokenLimit) * 100)
                  .toFixed(2)
                  .toLocaleString() + "%"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
