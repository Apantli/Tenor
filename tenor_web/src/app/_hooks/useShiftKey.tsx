import { useEffect, useState } from "react";

export default function useShiftKey() {
  const [shiftPressed, setShiftPressed] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      setShiftPressed(e.shiftKey);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      setShiftPressed(e.shiftKey); // Should be false when Shift is released
    };

    const onBlur = () => {
      // Reset state — we can't trust it anymore
      setShiftPressed(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return shiftPressed;
}
