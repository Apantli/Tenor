"use client";

import { useState, useEffect } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import ConversationButton from "./ConversationButton";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import ConversationPopup from "./ConversationPopup";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { api } from "~/trpc/react";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useParams } from "next/navigation";
import { useAlert } from "~/app/_hooks/useAlert";

interface HappinessFormProps {
  sprintReviewId?: number;
  onSubmit?: (responses: HappinessResponses) => void;
  onAnsweredCountChange?: (answeredCount: number) => void;
}

export interface HappinessResponses {
  roleFeeling: string;
  companyFeeling: string;
  improvementSuggestion: string;
}

const questionMapping = {
  roleFeeling: 1,
  companyFeeling: 2,
  improvementSuggestion: 3,
};

export default function HappinessForm({
  sprintReviewId,
  onSubmit,
  onAnsweredCountChange,
}: HappinessFormProps) {
  const { user } = useFirebaseAuth();
  const userId = user?.uid ?? "";
  const params = useParams();
  const projectId = params.projectId as string;
  const { alert } = useAlert();
  const { predefinedAlerts } = useAlert();

  const [renderConversation, showConversation, setShowConversation] =
    usePopupVisibilityState();

  const [responses, setResponses] = useState<HappinessResponses>({
    roleFeeling: "",
    companyFeeling: "",
    improvementSuggestion: "",
  });

  const [savedFields, setSavedFields] = useState({
    roleFeeling: false,
    companyFeeling: false,
    improvementSuggestion: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [derivedAnsweredCount, setDerivedAnsweredCount] = useState(0);

  const {
    data: existingAnswers,
    refetch: refetchAnswers,
    isLoading: queryIsLoading,
    error: queryError,
  } = api.sprintReviews.getReviewAnswers.useQuery(
    {
      projectId: projectId,
      reviewId: sprintReviewId ?? 0,
      userId,
    },
    {
      enabled: !!sprintReviewId && !!userId,
    },
  );

  useEffect(() => {
    if (existingAnswers) {
      const newResponsesData: Partial<HappinessResponses> = {};
      const newSavedFieldsData: Partial<typeof savedFields> = {};
      let answeredCount = 0;

      if (existingAnswers["1"]) {
        newResponsesData.roleFeeling = existingAnswers["1"];
        newSavedFieldsData.roleFeeling = true;
        answeredCount++;
      }
      if (existingAnswers["2"]) {
        newResponsesData.companyFeeling = existingAnswers["2"];
        newSavedFieldsData.companyFeeling = true;
        answeredCount++;
      }
      if (existingAnswers["3"]) {
        newResponsesData.improvementSuggestion = existingAnswers["3"];
        newSavedFieldsData.improvementSuggestion = true;
        answeredCount++;
      }

      setResponses((prev) => ({ ...prev, ...newResponsesData }));
      setSavedFields((prev) => ({ ...prev, ...newSavedFieldsData }));
      setDerivedAnsweredCount(answeredCount);
    } else if (!queryIsLoading) {
      setResponses({
        roleFeeling: "",
        companyFeeling: "",
        improvementSuggestion: "",
      });
      setSavedFields({
        roleFeeling: false,
        companyFeeling: false,
        improvementSuggestion: false,
      });
      setDerivedAnsweredCount(0);
    }
  }, [existingAnswers, queryIsLoading]);

  useEffect(() => {
    if (onAnsweredCountChange) {
      onAnsweredCountChange(derivedAnsweredCount);
    }
  }, [derivedAnsweredCount, onAnsweredCountChange]);

  useEffect(() => {
    if (!queryIsLoading) {
      setIsLoading(false);
    }
  }, [queryIsLoading]);

  useEffect(() => {
    if (queryError) {
      predefinedAlerts.unexpectedError();
      console.error("Error fetching review answers:", queryError.message);
      setIsLoading(false);
    }
  }, [queryError]);

  const saveAnswer = api.sprintReviews.saveReviewAnswers.useMutation({
    onSuccess: () => {
      void refetchAnswers();
    },
  });

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

  const handleSubmit = async () => {
    if (!sprintReviewId || !userId) return;

    const hasNewUnsavedContent =
      (!savedFields.roleFeeling && responses.roleFeeling.trim() !== "") ||
      (!savedFields.companyFeeling && responses.companyFeeling.trim() !== "") ||
      (!savedFields.improvementSuggestion &&
        responses.improvementSuggestion.trim() !== "");
    if (!hasNewUnsavedContent) {
      alert(
        "Oops...",
        "Please enter at least one response to a missing question.",
        {
          type: "error",
          duration: 5000,
        },
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const savePromises = Object.entries(responses).map(
        async ([field, value]) => {
          const fieldKey = field as keyof HappinessResponses;

          if (value && !savedFields[fieldKey]) {
            await saveAnswer.mutateAsync({
              projectId: projectId,
              reviewId: sprintReviewId,
              userId,
              questionNum: questionMapping[fieldKey],
              answerText: value as string,
            });
            setSavedFields((prev) => ({
              ...prev,
              [fieldKey]: true,
            }));
          }
        },
      );

      await Promise.all(savePromises);
      await refetchAnswers();

      if (onSubmit) {
        onSubmit(responses);
      }
    } catch (error) {
      console.error("Error saving responses:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || queryIsLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <LoadingSpinner color="primary" />
        <p className="text-lg font-semibold">Loading happiness form...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-app-border bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-2 text-2xl font-semibold">Happiness</h2>
        <p className="mb-4 text-gray-700">
          Help your team improve its performance and motivation by completing
          this happiness task.
        </p>
        <div className="flex flex-col gap-5">
          <div>
            <InputTextAreaField
              label="1. How do you feel about your current role and responsibilities within the project?"
              placeholder="Write 2 to 3 sentences answering the question..."
              value={responses.roleFeeling}
              onChange={(e) => handleChange(e, "roleFeeling")}
              disableAI={true}
              disabled={savedFields.roleFeeling}
            />
          </div>
          <div>
            <InputTextAreaField
              label="2. How do you feel about the company culture and team collaboration?"
              placeholder="Write 2 to 3 sentences answering the question..."
              value={responses.companyFeeling}
              onChange={(e) => handleChange(e, "companyFeeling")}
              disableAI={true}
              disabled={savedFields.companyFeeling}
            />
          </div>
          <div>
            <InputTextAreaField
              label="3. What are your suggestions for improvement for the next sprint and what would make you happier?"
              placeholder="Write 2 to 3 sentences answering the question..."
              value={responses.improvementSuggestion}
              onChange={(e) => handleChange(e, "improvementSuggestion")}
              disableAI={true}
              disabled={savedFields.improvementSuggestion}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex justify-between border-t border-gray-200 bg-white p-4">
        <ConversationButton onClick={handleConversationMode}>
          Try conversation mode
        </ConversationButton>
        <PrimaryButton
          type="button"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            (savedFields.roleFeeling &&
              savedFields.companyFeeling &&
              savedFields.improvementSuggestion)
          }
        >
          {isSubmitting ? "Saving..." : "Send report"}
        </PrimaryButton>
      </div>

      {renderConversation && (
        <ConversationPopup
          showPopup={showConversation}
          setShowPopup={setShowConversation}
        />
      )}
    </div>
  );
}
