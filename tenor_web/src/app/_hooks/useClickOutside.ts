import type React from "react";
import { useEffect } from "react";

export default function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T> | React.RefObject<T>[],
  callback: () => void,
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      let isOutside = true;
      for (const r of Array.isArray(ref) ? ref : [ref]) {
        if (r.current && r.current.contains(event.target as Node)) {
          isOutside = false;
          break;
        }
      }
      if (isOutside) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}
