"use client";

import React, { useState, useEffect } from "react";
import Popup from "~/app/_components/Popup";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import { generateRandomColor } from "~/app/_components/BacklogTagList";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import DropdownColorPicker from "~/app/_components/inputs/DropdownColorPicker";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import TagComponent from "~/app/_components/TagComponent";

interface Props {
  showPopup: boolean;
  statusId: string;
  setShowPopup: (show: boolean) => void;
}

export default function StatusDetailPopup({
  showPopup,
  setShowPopup,
  statusId,
}: Props) {
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const { predefinedAlerts } = useAlert();

  const { projectId } = useParams();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    color: string;
    orderIndex: number;
    marksTaskAsDone: boolean;
  }>({
    name: "",
    color: generateRandomColor(),
    orderIndex: 0,
    marksTaskAsDone: false,
  });

  const {
    data: statusDetail,
    isLoading,
    refetch,
    error,
  } = api.settings.getStatusTypeById.useQuery({
    projectId: projectId as string,
    statusId: statusId,
  });

  const { mutateAsync: modifyStatus, isPending: modifyingStatus } =
    api.settings.modifyStatusType.useMutation();
  const { mutateAsync: deleteStatus } =
    api.settings.deleteStatusType.useMutation();

  const isModified = () => {
    if (!statusDetail) return false;
    if (form.name !== statusDetail.name) return true;
    if (form.color !== statusDetail.color) return true;
    if (form.marksTaskAsDone !== statusDetail.marksTaskAsDone) return true;
    if (form.orderIndex !== statusDetail.orderIndex) return true;
    return false;
  };

  const handleDismiss = () => {
    setShowPopup(false);
  };

  useEffect(() => {
    if (!statusDetail) return;
    setForm({
      name: statusDetail.name,
      color: statusDetail.color,
      orderIndex: statusDetail.orderIndex,
      marksTaskAsDone: statusDetail.marksTaskAsDone,
    });
  }, [statusDetail]);

  useEffect(() => {
    if (error) {
      setShowPopup(false);
      predefinedAlerts.unexpectedError();
    }
  }, [error]);

  const handleSave = async (updatedData: NonNullable<typeof statusDetail>) => {
    const updatedStatus = {
      ...updatedData,
      name: form.name,
      color: form.color,
      marksTaskAsDone: form.marksTaskAsDone,
      orderIndex: form.orderIndex,
    };
    await utils.settings.getStatusTypeById.cancel({
      projectId: projectId as string,
      statusId: statusId,
    });
    utils.settings.getStatusTypeById.setData(
      { projectId: projectId as string, statusId: statusId },
      (oldData) => {
        if (!oldData) return;
        return { ...oldData, ...updatedStatus };
      },
    );
    await modifyStatus({
      projectId: projectId as string,
      statusId: statusId,
      status: {
        name: form.name,
        color: form.color,
        marksTaskAsDone: form.marksTaskAsDone,
        orderIndex: form.orderIndex,
        deleted: false,
      },
    });

    await utils.settings.getStatusTypes.invalidate({
      projectId: projectId as string,
    });
    await refetch();
  };
}
