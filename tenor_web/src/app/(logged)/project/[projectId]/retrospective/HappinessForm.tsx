"use client";

import { useState, useEffect } from "react";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import ConversationButton from "./ConversationButton";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import ConversationPopup from "./ConversationPopup";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import { api } from "~/trpc/react";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useParams } from "next/navigation";
import { useAlert } from "~/app/_hooks/useAlert";
import { useRetrospectiveCountdown } from "./useRetrospectiveCountdown";
import MoreInformation from "~/app/_components/helps/MoreInformation";
import useConfirmation from "~/app/_hooks/useConfirmation";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";

interface HappinessFormProps {
  sprintRetrospectiveId?: number;
  onSubmit?: (responses: HappinessResponses) => void;
  onCompletionChange?: (isCompleted: boolean) => void;
  retrospectiveEndDate?: Date | undefined;
}

export interface HappinessResponses {
  roleFeeling: string;
  companyFeeling: string;
  improvementSuggestion: string;
}

export default function HappinessForm({
  sprintRetrospectiveId,
  onSubmit,
  onCompletionChange,
  retrospectiveEndDate,
}: HappinessFormProps) {
  const { user } = useFirebaseAuth();
  const { projectId } = useParams();
  const { predefinedAlerts } = useAlert();
  const confirm = useConfirmation();

  const [renderConversation, showConversation, setShowConversation] =
    usePopupVisibilityState();

  const [responses, setResponses] = useState<HappinessResponses>({
    roleFeeling: "",
    companyFeeling: "",
    improvementSuggestion: "",
  });

  const { timeRemaining } = useRetrospectiveCountdown(
    retrospectiveEndDate ?? null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: existingAnswers,
    isLoading: retrospectiveAnswersLoading,
    error: queryError,
    refetch: refetchAnswers,
  } = api.sprintRetrospectives.getRetrospectiveAnswers.useQuery(
    {
      projectId: projectId as string,
      reviewId: sprintRetrospectiveId ?? 0,
      userId: user?.uid ?? "",
    },
    {
      enabled: !!sprintRetrospectiveId && !!user?.uid,
    },
  );

  const isCompleted = !!(
    existingAnswers?.["1"] &&
    existingAnswers?.["2"] &&
    existingAnswers?.["3"]
  );

  const displayResponses =
    isCompleted && existingAnswers
      ? {
          roleFeeling: existingAnswers["1"],
          companyFeeling: existingAnswers["2"],
          improvementSuggestion: existingAnswers["3"],
        }
      : responses;

  useEffect(() => {
    if (onCompletionChange) {
      onCompletionChange(isCompleted);
    }
  }, [isCompleted, onCompletionChange]);

  const saveAnswer = api.sprintRetrospectives.sendReport.useMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof HappinessResponses,
  ) => {
    setResponses({
      ...responses,
      [field]: e.target.value,
    });
  };

  const handleConversationMode = () => {
    setShowConversation(true);
  };

  const hasUnsavedChanges =
    !isCompleted &&
    !!(
      responses.roleFeeling ||
      responses.companyFeeling ||
      responses.improvementSuggestion
    );

  useNavigationGuard(
    async () => {
      if (hasUnsavedChanges) {
        return !(await confirm(
          "Unsaved Responses",
          "You have unsaved responses. Are you sure you want to leave?",
          "Leave",
          "Stay",
        ));
      }
      return false;
    },
    hasUnsavedChanges,
    "You have unsaved responses. Are you sure you want to leave?",
  );

  const handleSubmit = async () => {
    const confirmation = await confirm(
      "Confirm submission",
      "Your responses will be saved, and you won't be able to edit them later.",
      "Submit",
      "Keep Editing",
      false,
    );
    if (!confirmation) return;

    if (!sprintRetrospectiveId || !user?.uid || isCompleted) return;

    if (
      !responses.roleFeeling.trim() ||
      !responses.companyFeeling.trim() ||
      !responses.improvementSuggestion.trim()
    ) {
      predefinedAlerts.formCompletionError();
      return;
    }

    setIsSubmitting(true);

    try {
      await saveAnswer.mutateAsync({
        projectId: projectId as string,
        reviewId: sprintRetrospectiveId,
        data: {
          textAnswers: [
            responses.roleFeeling,
            responses.companyFeeling,
            responses.improvementSuggestion,
          ],
        },
        summarize: false,
      });

      if (onSubmit) {
        onSubmit(responses);
      }

      void refetchAnswers();
    } catch (error) {
      console.error("Error saving responses:", error);
      predefinedAlerts.unexpectedError();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (retrospectiveAnswersLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-app-border bg-white shadow-sm">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  if (queryError) {
    console.error("Error fetching retrospective answers:", queryError.message);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-app-border bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-2">
          <h2 className="mb-2 text-2xl font-semibold">Happiness</h2>
          <MoreInformation
            label={`The remaining time to complete this form is ${timeRemaining}.`}
            size="small"
          />
        </div>
        <p className="mb-4 text-gray-700">
          Help your team improve its performance and motivation by completing
          this happiness survey.
        </p>
        <div className="flex flex-col gap-5">
          <div>
            <InputTextAreaField
              label="1. How do you feel about your current role and responsibilities within the project?"
              placeholder="Write 2 to 3 sentences answering the question..."
              value={displayResponses.roleFeeling}
              onChange={(e) => handleChange(e, "roleFeeling")}
              disableAI={true}
              disabled={isCompleted}
            />
          </div>
          <div>
            <InputTextAreaField
              label="2. How do you feel about the company culture and team collaboration?"
              placeholder="Write 2 to 3 sentences answering the question..."
              value={displayResponses.companyFeeling}
              onChange={(e) => handleChange(e, "companyFeeling")}
              disableAI={true}
              disabled={isCompleted}
            />
          </div>
          <div>
            <InputTextAreaField
              label="3. What are your suggestions for improvement for the next sprint and what would make you happier?"
              placeholder="Write 2 to 3 sentences answering the question..."
              value={displayResponses.improvementSuggestion}
              onChange={(e) => handleChange(e, "improvementSuggestion")}
              disableAI={true}
              disabled={isCompleted}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex justify-between border-t border-gray-200 bg-white p-4">
        <ConversationButton
          onClick={handleConversationMode}
          disabled={isSubmitting || isCompleted}
        >
          Try conversation mode
        </ConversationButton>
        <PrimaryButton
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isCompleted}
          loading={isSubmitting}
        >
          Send report
        </PrimaryButton>
      </div>

      {renderConversation && (
        <ConversationPopup
          showPopup={showConversation}
          setShowPopup={setShowConversation}
          sprintRetrospectiveId={sprintRetrospectiveId}
        />
      )}
    </div>
  );
}
