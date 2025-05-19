"use client";

import { useState } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import ConversationButton from "./ConversationButton";
import InputTextField from "~/app/_components/inputs/InputTextField";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import ConversationPopup from "./ConversationPopup";

interface HappinessFormProps {
  onSubmit?: (responses: HappinessResponses) => void;
}

export interface HappinessResponses {
  roleFeeling: string;
  companyFeeling: string;
  improvementSuggestion: string;
}

export default function HappinessForm({}: HappinessFormProps) {
  const [renderConversation, showConversation, setShowConversation] =
    usePopupVisibilityState();
  const [responses, setResponses] = useState<HappinessResponses>({
    roleFeeling: "",
    companyFeeling: "",
    improvementSuggestion: "",
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

  return (
    <div className="flex h-full flex-col rounded-lg border border-app-border bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-2xl font-semibold">Happiness</h2>
      <p className="mb-4 text-gray-700">
        Help your team improve its performance and motivation by completing this
        happiness task.
      </p>
      <div className="flex flex-1 flex-col">
        <div className="flex-1">
          <label className="mb-2 block font-medium">
            How do you feel in terms of your role with the company?
          </label>
          <InputTextField
            placeholder="Write 2 to 3 sentences answering the question..."
            value={responses.roleFeeling}
            onChange={(e) => handleChange(e, "roleFeeling")}
            disableAI={true}
          />
        </div>

        <div className="flex-1">
          <label className="mb-2 block font-medium">
            How do you feel about the company in general?
          </label>
          <InputTextField
            placeholder="Write 2 to 3 sentences answering the question..."
            value={responses.companyFeeling}
            onChange={(e) => handleChange(e, "companyFeeling")}
            disableAI={true}
          />
        </div>

        <div className="flex-1">
          <label className="mb-2 block font-medium">
            What would make you happier in the next sprint?
          </label>
          <InputTextField
            placeholder="Write 2 to 3 sentences answering the question..."
            value={responses.improvementSuggestion}
            onChange={(e) => handleChange(e, "improvementSuggestion")}
            disableAI={true}
          />
        </div>

        <div className="flex justify-between">
          <ConversationButton onClick={handleConversationMode}>
            Try conversation mode
          </ConversationButton>
          <PrimaryButton type="submit">Send report</PrimaryButton>
        </div>
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
