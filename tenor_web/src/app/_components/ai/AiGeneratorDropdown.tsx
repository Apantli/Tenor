import React, { useRef, useState } from "react";
import Dropdown, { DropdownItem, useCloseDropdown } from "../Dropdown";
import FloatingLabelInput from "../inputs/FloatingLabelInput";
import { cn } from "~/lib/helpers/utils";
import useConfirmation from "~/app/_hooks/useConfirmation";
import AiButton from "../inputs/buttons/AiButton";

interface Props {
  singularLabel: string;
  pluralLabel: string;
  onGenerate?: (amount: number, prompt: string) => void;
  disabled?: boolean;
  alreadyGenerated?: boolean;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  className?: string;
}

export default function AiGeneratorDropdown({
  singularLabel,
  pluralLabel,
  onGenerate,
  disabled,
  alreadyGenerated,
  onAcceptAll,
  onRejectAll,
  className,
}: Props) {
  const [generationAmount, setGenerationAmount] = useState<number | null>(3);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [close, closeDropdown] = useCloseDropdown();

  const confirm = useConfirmation();

  const handleGenerate = () => {
    closeDropdown();
    if (generationAmount === null || !promptRef.current) return;
    const prompt = promptRef.current?.value ?? "";
    onGenerate?.(generationAmount, prompt);
    promptRef.current.value = "";
  };

  return (
    <Dropdown
      label={
        <AiButton
          asSpan
          disabled={disabled}
          tooltip={`Generate ${pluralLabel} with AI`}
        />
      }
      onOpen={() => {
        promptRef.current?.focus();
      }}
      disabled={disabled}
      close={close}
    >
      <DropdownItem>
        {!alreadyGenerated && (
          <>
            <div className={cn("mt-2 flex w-80 items-center gap-2", className)}>
              <FloatingLabelInput
                className="w-24"
                type="number"
                value={generationAmount?.toString() ?? ""}
                onChange={(e) => {
                  const amount = Math.min(
                    Math.max(parseInt(e.target.value), 1),
                    10,
                  );
                  if (isNaN(amount)) {
                    setGenerationAmount(null);
                  } else {
                    setGenerationAmount(amount);
                  }
                }}
              >
                Amount
              </FloatingLabelInput>
              <AiButton
                className="w-full"
                disabled={generationAmount === null}
                onClick={handleGenerate}
              >
                {generationAmount === null && <>Generate {pluralLabel}</>}
                {generationAmount !== null && (
                  <>
                    Generate {generationAmount}{" "}
                    {generationAmount === 1 ? singularLabel : pluralLabel}
                  </>
                )}
              </AiButton>
            </div>
            <textarea
              className="mt-2 min-h-20 w-full resize-none rounded-lg border border-app-border p-2"
              placeholder="Optionally specify a prompt..."
              ref={promptRef}
            ></textarea>
          </>
        )}
        {alreadyGenerated && (
          <div className="flex w-80 flex-col items-center justify-between gap-2">
            <span className="w-full text-lg text-app-text">
              {pluralLabel.at(0)?.toUpperCase() + pluralLabel.slice(1)} already
              generated
            </span>
            <p className="w-full whitespace-normal text-gray-500">
              Please sort through the generated {pluralLabel} before generating
              more.
            </p>
            <div className="flex w-full items-center gap-2">
              <button
                className="flex-1 rounded-md bg-app-fail p-2 text-white transition hover:bg-app-hover-fail"
                onClick={async () => {
                  closeDropdown();
                  if (
                    !(await confirm(
                      "Are you sure?",
                      "You are about to reject all generated items. This action cannot be undone.",
                      "Reject all",
                      "Keep editing",
                    ))
                  )
                    return;
                  onRejectAll?.();
                }}
              >
                Reject All
              </button>
              <button
                className="flex-1 rounded-md bg-app-secondary p-2 text-white transition hover:bg-app-hover-secondary"
                onClick={() => {
                  onAcceptAll?.();
                  // closeDropdown();
                }}
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </DropdownItem>
    </Dropdown>
  );
}
