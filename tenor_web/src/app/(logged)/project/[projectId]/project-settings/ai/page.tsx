"use client";

import FileList from "~/app/_components/inputs/FileList";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import LinkList from "~/app/_components/inputs/LinkList";

export default function ProjectAIConfig() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-row justify-between">
        <h1 className="mb-4 text-3xl font-semibold">AI Context</h1>
      </div>
      {/* {teamMembers && userTypes ? ( */}
      <InputTextAreaField label="Project Context"></InputTextAreaField>
      <FileList
        label={"Context Files"}
        files={[]}
        memoryLimit={0}
        handleFileAdd={function (files: File[]): void {
          throw new Error("Function not implemented.");
        }}
        handleFileRemove={function (file: File): void {
          throw new Error("Function not implemented.");
        }}
      ></FileList>
      <LinkList
        label={"Context Links"}
        links={[]}
        handleLinkAdd={function (link: string): void {
          throw new Error("Function not implemented.");
        }}
        handleLinkRemove={function (link: string): void {
          throw new Error("Function not implemented.");
        }}
      ></LinkList>
      {/* ) : (
        <div className="mt-5 flex flex-row gap-x-3">
          <LoadingSpinner />
          <p className="text-lg font-bold">Loading...</p>
        </div>
      )} */}
    </div>
  );
}
