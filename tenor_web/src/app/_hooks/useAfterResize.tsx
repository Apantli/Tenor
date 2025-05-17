import { useEffect } from "react";

export default function useAfterResize(callback: () => void) {
  useEffect(() => {
    window.addEventListener("resize", callback);
    return () => window.removeEventListener("resize", callback);
  });
}
