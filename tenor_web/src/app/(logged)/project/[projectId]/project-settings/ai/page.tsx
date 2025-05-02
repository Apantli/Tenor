"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toBase64 } from "~/utils/base64";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import FileList from "~/app/_components/inputs/FileList";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import LinkList from "~/app/_components/inputs/LinkList";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { api } from "~/trpc/react";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useAlert } from "~/app/_hooks/useAlert";

export default function ProjectAIConfig() {
  const { projectId } = useParams();
  const [newText, setNewText] = useState("");
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const { alert } = useAlert();

  // Fetch
  const { data: text, isLoading } = api.settings.getContextDialog.useQuery({
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
        const dummyContent = new Uint8Array(file.size);
        const blob = new Blob([dummyContent], { type: file.type });
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
  useMemo(() => {
    if (context) {
      setNewText(context);
    }
  }, [context]);

  // Add
  const { mutateAsync: addLink } = api.settings.addLink.useMutation();
  const { mutateAsync: addFiles } = api.settings.addFiles.useMutation();
  // Remove
  const { mutateAsync: removeLink } = api.settings.removeLink.useMutation();
  const { mutateAsync: removeFile } = api.settings.removeFile.useMutation();
  // Update
  const { mutateAsync: updateContext, isPending: isContextUpdatePending } =
    api.settings.updateTextContext.useMutation();

  // Link utils
  const handleAddLink = async (link: string) => {
    if (!links) return;
    const newData = links;
    newData.push(link);
    // Uses optimistic update
    await utils.settings.getContextLinks.cancel({
      projectId: projectId as string,
    });
    utils.settings.getContextLinks.setData(
      { projectId: projectId as string },
      newData,
    );
    // Add to database
    await addLink({
      projectId: projectId as string,
      link: link,
    });

    await utils.settings.getContextLinks.invalidate({
      projectId: projectId as string,
    });

    alert("Success", "A new link was added to your project AI context.", {
      type: "success",
      duration: 5000,
    });
  };

  const handleRemoveLink = async (link: string) => {
    if (!links) return;
    const newData = links.filter((l) => l !== link);
    // Uses optimistic update
    await utils.settings.getContextLinks.cancel({
      projectId: projectId as string,
    });
    utils.settings.getContextLinks.setData(
      { projectId: projectId as string },
      newData,
    );
    // Remove from database
    await removeLink({
      projectId: projectId as string,
      link: link,
    });

    await utils.settings.getContextLinks.invalidate({
      projectId: projectId as string,
    });
  };

  // File utils
  const handleAddFiles = async (newFiles: File[]) => {
    if (!newFiles || !files) return;
    const newData = [...files, ...newFiles];
    // Uses optimistic update
    await utils.settings.getContextFiles.cancel({
      projectId: projectId as string,
    });
    utils.settings.getContextFiles.setData(
      { projectId: projectId as string },
      newData,
    );
    const filesBase64Encoded: {
      name: string;
      type: string;
      content: string;
      size: number;
    }[] = [];

    for (const file of newFiles) {
      const fileBase64 = (await toBase64(file)) as string;
      filesBase64Encoded.push({
        name: file.name,
        type: file.type,
        content: fileBase64,
        size: file.size,
      });
    }

    // Add to database
    await addFiles({
      projectId: projectId as string,
      files: filesBase64Encoded,
    });

    await utils.settings.getContextFiles.invalidate({
      projectId: projectId as string,
    });

    alert("Success", "A new file was added to your project AI context.", {
      type: "success",
      duration: 5000,
    });
  };

  const handleRemoveFile = async (file: File) => {
    if (!files) return;
    const newData = files.filter((f) => f.name !== file.name);
    // Uses optimistic update
    await utils.settings.getContextFiles.cancel({
      projectId: projectId as string,
    });
    utils.settings.getContextFiles.setData(
      { projectId: projectId as string },
      newData,
    );
    // Remove from database
    await removeFile({
      projectId: projectId as string,
      file: file.name,
    });

    await utils.settings.getContextFiles.invalidate({
      projectId: projectId as string,
    });
  };

  // Text util
  const handleUpdateText = async (text: string) => {
    // Uses optimistic update
    await utils.settings.getContextDialog.cancel({
      projectId: projectId as string,
    });
    utils.settings.getContextDialog.setData(
      { projectId: projectId as string },
      text,
    );
    // Update in database
    await updateContext({
      projectId: projectId as string,
      text: text,
    });

    await utils.settings.getContextDialog.invalidate({
      projectId: projectId as string,
    });

    alert("Success", "Project AI context has been updated successfully.", {
      type: "success",
      duration: 5000,
    });
  };

  const isModified = () => {
    return newText != text && !isLoading;
  };

  useNavigationGuard(
    async () => {
      if (isModified()) {
        return !(await confirm(
          "Are you sure?",
          "You have unsaved changes. Do you want to leave?",
          "Discard changes",
          "Keep editing",
        ));
      }
      return false;
    },
    isModified(),
    "Are you sure you want to leave? You have unsaved changes.",
  );

  return (
    <div className="flex h-full max-w-[600px] flex-col">
      <div className="flex flex-row justify-between">
        <div className="flex w-full items-center justify-between">
          <h1 className="mb-4 text-3xl font-semibold">AI Context</h1>
          {(isModified() || isContextUpdatePending) && (
            <PrimaryButton
              onClick={async () => {
                await handleUpdateText(newText);
              }}
              loading={isContextUpdatePending}
            >
              Save
            </PrimaryButton>
          )}
        </div>
      </div>
      {links && loadedFiles && !isLoading ? (
        <div className="flex flex-col gap-4">
          <InputTextAreaField
            label="Project Context"
            value={newText}
            onChange={(e) => {
              setNewText(e.target.value);
            }}
            placeholder="Tell us about your project..."
            className="h-[250px]"
            labelClassName="text-lg font-semibold"
          ></InputTextAreaField>
          <FileList
            label={"Context Files"}
            files={loadedFiles}
            memoryLimit={10000000}
            handleFileAdd={handleAddFiles}
            handleFileRemove={handleRemoveFile}
          ></FileList>
          <LinkList
            label={"Context Links"}
            links={links}
            handleLinkAdd={handleAddLink}
            handleLinkRemove={handleRemoveLink}
          ></LinkList>
        </div>
      ) : (
        <div className="mt-5 flex flex-row gap-x-3">
          <LoadingSpinner />
          <p className="text-lg">Loading...</p>
        </div>
      )}
    </div>
  );
}
