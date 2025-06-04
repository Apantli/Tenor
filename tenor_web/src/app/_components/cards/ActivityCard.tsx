import type { ProjectPreview, UserPreview } from "~/lib/types/detailSchemas";
import type {
  ProjectActivityDetail,
  WithId,
  WithProjectId,
} from "~/lib/types/firebaseSchemas";
import ProfilePicture from "../ProfilePicture";
import { getRelativeTimeString } from "~/lib/helpers/firestoreTimestamp";
import TagComponent from "../TagComponent";
import {
  getAccentHexColorByCardType,
  getPillColorByActivityType,
} from "~/lib/helpers/colorUtils";
import { capitalize } from "@mui/material";
import { displayNameByType } from "~/lib/helpers/typeDisplayName";
import ProjectPicture from "../ProjectPicture";

interface Props {
  item: ProjectActivityDetail | WithProjectId<ProjectActivityDetail>;
  formattedScrumId: string;
  user?: WithId<UserPreview>;
  project?: WithId<ProjectPreview>;
}

export default function ActivityCard({
  item,
  formattedScrumId,
  user,
  project,
}: Props) {
  const firebaseTimestampToDate = getRelativeTimeString;
  return (
    <div className="flex w-full flex-row border-b-2 px-3 py-4 transition hover:bg-gray-100">
      <div className="flex w-3/4 flex-col items-start">
        <h3 className="line-clamp-1 w-full text-ellipsis break-all text-lg font-semibold">
          {formattedScrumId && (
            <>
              {formattedScrumId}
              {item.name && (
                <>
                  : <span className="font-normal">{item.name}</span>
                </>
              )}
            </>
          )}
        </h3>
        <div className="flex w-full flex-row items-center justify-start">
          {user ? (
            <ProfilePicture pictureClassName="self-center" user={user} />
          ) : item.userId ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
              <span title={`Unknown user: ${item.userId}`}>?</span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">
              <span>-</span>
            </div>
          )}

          <div className="flex flex-col pl-2">
            {/* Show generic user label or system */}
            <p className="text-xs text-gray-600">
              {item.userId ? "" : "System"}
            </p>

            {/* Show date */}
            {item.date && (
              <p className="text-s text-blakc self-center">
                {firebaseTimestampToDate(item.date)}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex w-1/4 flex-col items-end justify-end gap-1">
        {project ? (
          <ProjectPicture
            pictureClassName="self-center"
            project={project}
            scale={0.5}
          />
        ) : "projectId" in item && item.projectId ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
            <span title={`Unknown user: ${item.projectId}`}>?</span>
          </div>
        ) : null}
        <div className="flex flex-row items-center gap-2">
          {/* Action tag with dynamic background color */}
          <TagComponent
            color={getPillColorByActivityType(item.action)}
            reducedPadding
          >
            {capitalize(item.action || "")}
          </TagComponent>

          {/* Type badges - keep as is */}
          <TagComponent
            color={getAccentHexColorByCardType(item.type)}
            reducedPadding
          >
            {displayNameByType[item.type]}
          </TagComponent>
        </div>
      </div>
    </div>
  );
}
