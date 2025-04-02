import { useEffect } from "react";

export default function useAfterScroll(
  callback: () => void,
  ref?: React.RefObject<HTMLDivElement>,
) {
  useEffect(() => {
    if (ref?.current) {
      ref.current.addEventListener("scroll", callback);
    } else {
      window.addEventListener("scroll", callback);
    }
    return () => {
      if (ref?.current) {
        ref.current.removeEventListener("scroll", callback);
      } else {
        window.removeEventListener("scroll", callback);
      }
    };
  });
}
