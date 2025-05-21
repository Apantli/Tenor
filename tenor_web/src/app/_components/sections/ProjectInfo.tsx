import { api } from "~/trpc/react";
import { useState } from "react";
import LoadingSpinner from "../LoadingSpinner";
import TertiaryButton from "../buttons/TertiaryButton";
import Markdown from "react-markdown";


export default function ProjectInfo({projectId}: {projectId: string}) {

  const { data: project, isLoading } = api.projects.getGeneralConfig.useQuery({projectId});
  const [showDescription, setShowDescription] = useState(false);
  
  const projectTitle = project?.name ?? "Project Name";
  let projectDescription = project?.description;
  // Check if the description is empty or undefined
  if (!projectDescription) {
    projectDescription = "No description available.";
  }

  // Define the length of the preview text
  const previewLength = 255;

  // Check if the description is longer than the preview length
  // If it is, truncate it and add "..." at the end
  const shouldTruncate = projectDescription.length > previewLength;
  const previewText = shouldTruncate
    ? projectDescription.slice(0, previewLength) + "..."
    : projectDescription;

  // Show full description if explicitly requested or if we shouldn't truncate
  const shouldShowFullDescription = showDescription || !shouldTruncate;

  if (isLoading) {
    return (
      <div className="flex w-full align-center flex-col gap-5 border-2 rounded-lg p-5">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-row items-start gap-3 justify-start w-full">
        <div className="h-[80px] w-[80px] min-w-[80px] items-center justify-center overflow-hidden rounded-md border-2 bg-white">
          <img
          src={
            project?.logo
              ? project.logo.startsWith("/")
                ? project.logo
                : `/api/image_proxy/?url=${encodeURIComponent(project.logo)}`
              : ""
          }
          alt="Project Logo"
          className="h-full w-full rounded-md object-contain p-[4px]"
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{projectTitle}</h1>
        </div>
      </div>
      <div className="text-m text-app-primary w-full">
        <div className="flex flex-col gap-2 w-full text-left">
          <Markdown>
            { shouldShowFullDescription ? projectDescription : previewText}
          </Markdown>
        </div>
        <div className="w-full flex justify-end">
          {shouldTruncate && (
            <TertiaryButton
              onClick={() => setShowDescription(!showDescription)}
            >
              {showDescription ? "Read less" : "Read more"}
            </TertiaryButton>
          )}
        </div>
      </div>
    </div>
  )
}
