import type { User } from "firebase/auth";
import type { UserRecord } from "node_modules/firebase-admin/lib/auth/user-record";
import React from "react";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";

interface Props {
  user: User | UserRecord | null;
  hideTooltip?: boolean;
  className?: ClassNameValue;
}

export default function ProfilePicture({
  user,
  className,
  hideTooltip,
}: Props) {
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        className="h-8 w-8 rounded-full"
        data-tooltip-id="tooltip"
        data-tooltip-content={user?.displayName}
        data-tooltip-place="top-start"
        data-tooltip-hidden={!!hideTooltip}
      />
    );
  } else {
    return (
      <div
        className={cn(
          "gradient flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-t from-gray-600 to-gray-500 font-bold text-white",
          className,
        )}
        data-tooltip-id="tooltip"
        data-tooltip-content={user?.displayName}
        data-tooltip-place="top-start"
        data-tooltip-hidden={!!hideTooltip}
      >
        {user?.displayName?.slice(0, 1) ?? "?"}
      </div>
    );
  }
}
