"use client";

import { util } from "chai";
import { link } from "fs";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import FileList from "~/app/_components/inputs/FileList";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import LinkList from "~/app/_components/inputs/LinkList";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { api } from "~/trpc/react";

export default function ProjectAIConfig() {
  const { projectId } = useParams();
  const { data: text } = api.settings.getContextDialog.useQuery({
    projectId: projectId as string,
  });
  const { data: links } = api.settings.getContextLinks.useQuery({
    projectId: projectId as string,
  });
  const { data: files } = api.settings.getContextFiles.useQuery({
    projectId: projectId as string,
  });
  const loadedFiles = useMemo(() => {
    const resultFiles: File[] = [];
    console.log(resultFiles);
    if (files) {
      files.forEach((file) => {
        const blob = new Blob([], { type: file.type });
        const newFile = new File([blob], file.name, { type: file.type });
        resultFiles.push(newFile);
      });
      return resultFiles;
    }
    return [];
  }, [files]);
  const { data: context } = api.settings.getContextDialog.useQuery({
    projectId: projectId as string,
  });

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-row justify-between">
        <h1 className="mb-4 text-3xl font-semibold">AI Context</h1>
      </div>
      {links && loadedFiles && text !== null ? (
        <div>
          <InputTextAreaField
            label="Project Context"
            value={text}
          ></InputTextAreaField>
          <FileList
            label={"Context Files"}
            files={loadedFiles}
            memoryLimit={0}
            handleFileAdd={function (files: File[]): void {
              throw new Error("Function not implemented.");
            }}
            handleFileRemove={function (file: File): void {
              console.log(files);
            }}
          ></FileList>
          <LinkList
            label={"Context Links"}
            links={links}
            handleLinkAdd={function (link: string): void {
              throw new Error("Function not implemented.");
            }}
            handleLinkRemove={function (link: string): void {
              throw new Error("Function not implemented.");
            }}
          ></LinkList>
        </div>
      ) : (
        <div className="mt-5 flex flex-row gap-x-3">
          <LoadingSpinner />
          <p className="text-lg font-bold">Loading...</p>
        </div>
      )}
    </div>
  );
}
