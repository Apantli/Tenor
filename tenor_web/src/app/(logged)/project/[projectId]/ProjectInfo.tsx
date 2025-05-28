import { api } from "~/trpc/react";
import { useState } from "react";
import Markdown from "react-markdown";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import TertiaryButton from "~/app/_components/inputs/buttons/TertiaryButton";

export default function ProjectInfo({
  projectId,
  onExpandChange,
}: {
  projectId: string;
  onExpandChange?: (expanded: boolean) => void;
}) {
  const { data: project, isLoading } = api.projects.getGeneralConfig.useQuery({
    projectId,
  });
  const [showDescription, setShowDescription] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const projectTitle = project?.name ?? "Project Name";
  let projectDescription = project?.description;
  // Check if the description is empty or undefined
  if (!projectDescription) {
    projectDescription = "No description available.";
  }

  // Define the length of the preview text
  const previewLength = 270;

  // Check if the description is longer than the preview length
  // If it is, truncate it and add "..." at the end
  const shouldTruncate = projectDescription.length > previewLength;
  const previewText = shouldTruncate
    ? projectDescription.slice(0, previewLength) + "..."
    : projectDescription;

  // Show full description if explicitly requested or if we shouldn't truncate
  const shouldShowFullDescription = showDescription || !shouldTruncate;

  const handleExpandToggle = () => {
    const newExpandedState = !showDescription;
    setShowDescription(newExpandedState);

    // Notify parent component
    if (onExpandChange) {
      onExpandChange(newExpandedState);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center gap-3">
      <div className="flex w-full flex-row items-start justify-start gap-3">
        <div className="h-[80px] w-[80px] min-w-[80px] items-center justify-center overflow-hidden rounded-md border-2 bg-white">
          {isImageLoading && (
            <div className="flex h-full w-full items-center justify-center">
              <LoadingSpinner color="primary" />
            </div>
          )}
          <img
            src={
              project?.logo
                ? project.logo.startsWith("/")
                  ? project.logo
                  : `/api/image_proxy/?url=${encodeURIComponent(project.logo)}`
                : ""
            }
            alt="Project Logo"
            className={`h-full w-full rounded-md object-contain p-[4px] ${isImageLoading ? "hidden" : ""}`}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{projectTitle}</h1>
        </div>
      </div>
      <div className="relative h-full w-full overflow-y-auto">
        <div className="flex w-full flex-col gap-2 text-left">
          <Markdown>
            {shouldShowFullDescription ? projectDescription : previewText}
          </Markdown>
        </div>
        <div className="-mt-3 flex w-full justify-end">
          {shouldTruncate && (
            <TertiaryButton onClick={handleExpandToggle}>
              {showDescription ? "Read less" : "Read more"}
            </TertiaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
