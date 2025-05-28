import { useParams } from "next/navigation";
import React from "react";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { api } from "~/trpc/react";

interface Props {
  primaryEmotion?: string;
  textAnswers: string[];
}

export default function RetrospectiveConversationAnswers({
  primaryEmotion,
  textAnswers,
}: Props) {
  const { projectId } = useParams();

  const { data: answerData, isLoading } =
    api.sprintRetrospectives.getProcessedRetrospectiveAnswers.useQuery({
      projectId: projectId as string,
      data: {
        textAnswers,
      },
    });

  return (
    <div className="h-full w-full">
      {isLoading || !answerData ? (
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner color="dark" />
          <p className="ml-2">Processing your responses...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5">
            <h2 className="mt-4 text-2xl font-semibold">Happiness analysis</h2>
            <p>{answerData.happinessAnalysis}</p>
            <p>
              <strong>Happiness:</strong> {answerData.happinessRating} / 10
            </p>
            {primaryEmotion && (
              <p>
                <strong>Primary emotion:</strong>{" "}
                {primaryEmotion[0]?.toUpperCase()}
                {primaryEmotion.slice(1)}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <h2 className="mt-4 text-2xl font-semibold">Your answers</h2>
            <InputTextAreaField
              label="Think about your role in the project. How did it feel to carry your responsibilities, and what satisfied you?"
              value={answerData.answers[0]}
              className="min-h-[150px]"
              disabled
              disableAI
            />
            <InputTextAreaField
              label="Think about your team. How would you describe the energy and collaboration within your team and the company?"
              value={answerData.answers[1]}
              className="min-h-[150px]"
              disabled
              disableAI
            />
            <InputTextAreaField
              label="Imagine the next sprint. What small changes could make it better, and what would help you thrive even more?"
              value={answerData.answers[2]}
              className="min-h-[150px]"
              disabled
              disableAI
            />
          </div>
        </div>
      )}
    </div>
  );
}
