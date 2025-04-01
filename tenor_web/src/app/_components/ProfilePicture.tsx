import type { User } from "firebase/auth";
import type { UserRecord } from "node_modules/firebase-admin/lib/auth/user-record";
import React from "react";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import * as crypto from "crypto";

interface Props {
  user: User | UserRecord | null;
  hideTooltip?: boolean;
  className?: ClassNameValue;
}

function getUserGradient(uid: string, hashFuncName = "sha256") {
  const hash = crypto.createHash(hashFuncName);
  hash.update(uid, "utf-8");
  const hex = hash.digest("hex").substring(0, 6); // Take the first 6 hex characters

  // Convert hex to RGB, darken, and convert back.
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Darken the RGB values (adjust the factor as needed)
  const initialFactor = 0.95; // 0.0 - 1.0 (1.0 = no change, 0.0 = black)
  const darkenFactor = 0.9; // 0.0 - 1.0 (1.0 = no change, 0.0 = black)
  r = Math.floor(r * initialFactor);
  g = Math.floor(g * initialFactor);
  b = Math.floor(b * initialFactor);

  // Convert back to hex
  const hexCode =
    ("0" + r.toString(16)).slice(-2) +
    ("0" + g.toString(16)).slice(-2) +
    ("0" + b.toString(16)).slice(-2);

  r = Math.floor(r * darkenFactor);
  g = Math.floor(g * darkenFactor);
  b = Math.floor(b * darkenFactor);

  // Convert back to hex
  const darkHexCode =
    ("0" + r.toString(16)).slice(-2) +
    ("0" + g.toString(16)).slice(-2) +
    ("0" + b.toString(16)).slice(-2);

  return { hexCode, darkHexCode };
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
    const { hexCode, darkHexCode } = getUserGradient(user?.uid ?? "");
    return (
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full font-bold text-white",
          className,
        )}
        style={{
          background: `linear-gradient(to top, #${darkHexCode}, #${hexCode})`,
        }}
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
