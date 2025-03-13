"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface UploadedFile {
  url: string;
  name: string;
}

function FilesDisplay({ files }: { files: UploadedFile[] }) {
  const imagePredicate = (file: UploadedFile) =>
    file.name.endsWith(".png") || file.name.endsWith(".jpg");

  const imageFiles = files.filter(imagePredicate);
  const otherFiles = files.filter((file) => !imagePredicate(file));

  return (
    <div>
      {otherFiles.map((file, i) => (
        <a className="text-blue-500" href={file.url} key={i}>
          {file.name}
        </a>
      ))}
      {otherFiles.length == 0 && "You don't have any files"}
      {imageFiles.length > 0 && (
        <h1 className="mt-4 text-lg font-semibold">Your pictures</h1>
      )}
      <div className="mt-4 flex flex-row gap-4">
        {imageFiles.map((file, i) => (
          <div key={i}>
            <img
              className="h-80 w-80 border border-app-border object-cover"
              src={file.url}
              alt={file.name}
              key={i}
            />
            <a className="text-blue-500" href={file.url}>
              {file.name}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, refetch, error } = api.files.getUserFiles.useQuery();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0] ?? null);
    }
  };

  const submitFile = async () => {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch("/api/file_upload", {
        method: "POST",
        body: formData,
      });

      setFile(null);
      await refetch();
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-app-text">File Upload</h1>
      <div className="flex flex-row items-center">
        <div className="flex flex-row items-center gap-4">
          <label
            htmlFor="fileUpload"
            className="cursor-pointer rounded-md border border-app-border p-2 text-black disabled:cursor-auto"
          >
            Choose file
          </label>
          <input
            type="file"
            id="fileUpload"
            onChange={handleFileChange}
            hidden
          />
          <span className="w-80">{file?.name ?? "No file selected..."}</span>
        </div>
        <button
          className="rounded-md bg-app-primary p-2 text-white disabled:bg-gray-400"
          disabled={file === null || uploading}
          onClick={submitFile}
        >
          {uploading ? "Uploading..." : "Upload file"}
        </button>
      </div>
      <h1 className="mt-4 text-lg font-semibold text-app-text">Your files</h1>
      {isLoading ? (
        "Loading..."
      ) : (data?.length ?? 0 > 0) ? (
        <FilesDisplay files={data ?? []} />
      ) : error?.data?.code == "UNAUTHORIZED" ? (
        "Log in to see your files"
      ) : (
        "You don't have files"
      )}
    </div>
  );
}
