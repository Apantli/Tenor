import { type inferRouterOutputs } from "@trpc/server";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { type sprintRetrospectivesRouter } from "~/server/api/routers/sprintRetrospectives";

interface Props {
  primaryEmotion?: string;
  processedAnswers?: inferRouterOutputs<
    typeof sprintRetrospectivesRouter
  >["getProcessedRetrospectiveAnswers"];
  isProcessingAnswers: boolean;
}

export default function RetrospectiveConversationAnswers({
  primaryEmotion,
  processedAnswers,
  isProcessingAnswers,
}: Props) {
  return (
    <div className="h-full w-full">
      {isProcessingAnswers || !processedAnswers ? (
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner color="dark" />
          <p className="ml-2">Processing your responses...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5">
            <h2 className="mt-4 text-2xl font-semibold">Happiness analysis</h2>
            <p>{processedAnswers.happinessAnalysis}</p>
            <p>
              <strong>Happiness:</strong> {processedAnswers.happinessRating} /
              10
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
              value={processedAnswers.answers[0]}
              className="min-h-[150px]"
              disabled
              disableAI
            />
            <InputTextAreaField
              label="Think about your team. How would you describe the energy and collaboration within your team and the company?"
              value={processedAnswers.answers[1]}
              className="min-h-[150px]"
              disabled
              disableAI
            />
            <InputTextAreaField
              label="Imagine the next sprint. What small changes could make it better, and what would help you thrive even more?"
              value={processedAnswers.answers[2]}
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
