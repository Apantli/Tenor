import { useEffect, useState } from "react";

export default function useWindowResize(callback: () => void) {
  useEffect(() => {
    window.addEventListener("resize", callback);
    return () => window.removeEventListener("resize", callback);
  });
}

export function useWindowRect() {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      setRect(document.documentElement.getBoundingClientRect());
    };

    window.addEventListener("resize", updateRect);
    updateRect(); // Initial call to set the rect

    return () => window.removeEventListener("resize", updateRect);
  }, []);

  const isTablet = (rect?.width ?? 1400) < 1280;

  return { rect, isTablet };
}
