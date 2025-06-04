import { useState } from "react";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/helpers/utils";
import LoadingSpinner from "./LoadingSpinner";
import type { ProjectPreview } from "~/lib/types/detailSchemas";

interface Props {
  project:
    | ProjectPreview
    | { name?: string; logo?: string; id?: string }
    | null;
  hideTooltip?: boolean;
  className?: ClassNameValue;
  pictureClassName?: ClassNameValue;
  scale?: number;
}

export default function ProjectPicture({
  project,
  className,
  hideTooltip,
  pictureClassName,
  scale = 1.0,
}: Props) {
  const [loadingImage, setLoadingImage] = useState<boolean>(true);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-md border-2 bg-white",
        className,
      )}
      style={{
        width: `${80 * scale}px`,
        height: `${80 * scale}px`,
        minWidth: `${80 * scale}px`,
      }}
    >
      {loadingImage && (
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
        alt={project?.name ?? "Project Logo"}
        className={cn(
          "h-full w-full rounded-md object-contain",
          loadingImage ? "hidden" : "",
          pictureClassName,
        )}
        style={{
          padding: `${4 * scale}px`,
        }}
        onLoad={() => setLoadingImage(false)}
        onError={() => setLoadingImage(false)}
        data-tooltip-id="tooltip"
        data-tooltip-content={project?.name}
        data-tooltip-place="top-start"
        data-tooltip-hidden={!!hideTooltip}
      />
    </div>
  );
}
