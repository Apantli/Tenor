"use client";

import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { toBase64 } from "~/lib/helpers/base64";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import FileList from "~/app/_components/inputs/FileList";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import LinkList from "~/app/_components/inputs/LinkList";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { api } from "~/trpc/react";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useAlert } from "~/app/_hooks/useAlert";
import HelpIcon from "@mui/icons-material/Help";
import { type Links } from "~/server/api/routers/settings";
import {
  type Permission,
  permissionNumbers,
} from "~/lib/types/firebaseSchemas";
import { emptyRole } from "~/lib/defaultValues/roles";
import { checkPermissions } from "~/lib/defaultValues/permission";

export default function ProjectAIConfig() {
  const { projectId } = useParams();
  const [newText, setNewText] = useState("");
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const { predefinedAlerts, alertTemplates } = useAlert();

  // Fetch
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["settings"],
      },
      role ?? emptyRole,
    );
  }, [role]);

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
  const { mutateAsync: addLink } = api.settings.addLink.useMutation({
    onError: async (error) => {
      alertTemplates.error(error.message);
      await utils.settings.getContextLinks.invalidate({
        projectId: projectId as string,
      });
    },
    onSuccess: async () => {
      predefinedAlerts.linkUploadSuccess();
      await utils.settings.getContextLinks.invalidate({
        projectId: projectId as string,
      });
    },
    retry: 0,
  });
  const { mutateAsync: addFiles } = api.settings.addFiles.useMutation();
  // Remove
  const { mutateAsync: removeLink } = api.settings.removeLink.useMutation();
  const { mutateAsync: removeFile } = api.settings.removeFile.useMutation();
  // Update
  const { mutateAsync: updateContext, isPending: isContextUpdatePending } =
    api.settings.updateTextContext.useMutation();

  // Link utils
  const handleAddLink = async (link: Links) => {
    if (!links) return;

    if (links.some((l) => l.link === link.link)) {
      predefinedAlerts.linkExistsError();
      return;
    }

    const newData = links;
    newData.push({ link: link.link, valid: true });
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
      link: link.link,
    });
  };

  useEffect(() => {
    const invalidLinks = [];
    for (const link of links ?? []) {
      if (!link.valid) invalidLinks.push(link);
    }
    if (invalidLinks.length > 0) {
      predefinedAlerts.linkInvalidError(invalidLinks.length);
    }
  }, [links]);

  const handleRemoveLink = async (link: Links) => {
    if (!links) return;
    const newData = links.filter((l) => l.link !== link.link);
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
      link: link.link,
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

    predefinedAlerts.fileUploadSuccess();
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

    predefinedAlerts.contextUpdateSuccess();
  };

  const isModified = () => {
    return newText != text;
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
          <div className="mb-4 flex items-center gap-2">
            <h1 className="text-3xl font-semibold">AI Context</h1>
            <HelpIcon
              className="text-gray-500"
              data-tooltip-id="tooltip"
              data-tooltip-content="The data shared, including files and links, is private and used solely as context for the AI."
              data-tooltip-place="top-start"
              style={{ width: "20px" }}
            />
          </div>
          {(isModified() || isContextUpdatePending) &&
            links &&
            loadedFiles &&
            !isLoading && (
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
            id="project-context-field"
            disabled={permission < permissionNumbers.write}
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
            disabled={permission < permissionNumbers.write}
            label={"Context Files"}
            files={loadedFiles}
            memoryLimit={10000000}
            handleFileAdd={handleAddFiles}
            handleFileRemove={handleRemoveFile}
          ></FileList>
          <LinkList
            disabled={permission < permissionNumbers.write}
            label={"Context Links"}
            links={links.map((link) => ({
              link: link.link,
              content: link.valid ? "valid" : null,
            }))}
            handleLinkAdd={handleAddLink}
            handleLinkRemove={handleRemoveLink}
          ></LinkList>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center">
          <LoadingSpinner color="primary" />
        </div>
      )}
    </div>
  );
}
