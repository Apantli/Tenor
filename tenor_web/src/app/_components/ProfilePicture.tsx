import type { User } from "firebase/auth";
import type { UserRecord } from "node_modules/firebase-admin/lib/auth/user-record";
import React, { useEffect, useState } from "react";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/helpers/utils";
import * as crypto from "crypto";

interface Props {
  user:
    | User
    | UserRecord
    | { displayName?: string; photoURL?: string; uid?: string }
    | { displayName?: string; photoURL?: string; id?: string }
    | null;
  hideTooltip?: boolean;
  className?: ClassNameValue;
  pictureClassName?: ClassNameValue;
  size?: number;
  skipProxy?: boolean;
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
  const darkenFactor = 0.7; // 0.0 - 1.0 (1.0 = no change, 0.0 = black)
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
  pictureClassName,
  size = 32,
  skipProxy = false,
}: Props) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [forceFallback, setForceFallback] = useState(false);

  const sizePixels = `${size}px`;

  let uid = "0";
  if (user) {
    if ("uid" in user) uid = user.uid ?? "0";
    else if ("id" in user) uid = user.id ?? "0";
  }
  const { hexCode, darkHexCode } = getUserGradient(uid);

  const shouldShowImage = user?.photoURL && !imgError && !forceFallback;

  useEffect(() => {
    if (user?.photoURL && !imgError && !imgLoaded) {
      const fallbackTimeout = setTimeout(() => {
        setForceFallback(true);
      }, 3000); // 1.5 seconds fallback delay

      return () => clearTimeout(fallbackTimeout);
    }
  }, [user?.photoURL, imgError, imgLoaded]);

  return shouldShowImage ? (
    <img
      src={
        skipProxy
          ? user.photoURL
          : `/api/image_proxy?url=${encodeURIComponent(user.photoURL)}`
      }
      alt=""
      className={cn(
        "rounded-full",
        {
          "animate-pulse bg-gray-200": !imgLoaded,
        },
        className,
        pictureClassName,
      )}
      style={{
        height: sizePixels,
        width: sizePixels,
        minWidth: sizePixels,
        minHeight: sizePixels,
      }}
      data-tooltip-id="tooltip"
      data-tooltip-content={user?.displayName}
      data-tooltip-place="top-start"
      data-tooltip-hidden={!!hideTooltip}
      onError={() => {
        setImgError(true);
      }}
      onLoad={() => {
        setImgLoaded(true);
      }}
    />
  ) : (
    <div
      className={cn(
        "flex cursor-default select-none items-center justify-center rounded-full font-bold text-white",
        className,
        pictureClassName,
      )}
      style={{
        background: `linear-gradient(to top, #${darkHexCode}, #${hexCode})`,
        height: sizePixels,
        width: sizePixels,
        minWidth: sizePixels,
        minHeight: sizePixels,
        fontSize: `${size / 2}px`,
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
