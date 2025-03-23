import { useEffect, useState } from "react";

export default function useShiftKey() {
  const [shiftPressed, setShiftPressed] = useState(false);

  const onKeyDown: EventListener = (e) => {
    if ((e as KeyboardEvent).key === "Shift") {
      setShiftPressed(true);
    }
  };
  const onKeyUp: EventListener = (e) => {
    if ((e as KeyboardEvent).key === "Shift") {
      setShiftPressed(false);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return shiftPressed;
}
