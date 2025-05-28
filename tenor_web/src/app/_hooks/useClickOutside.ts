import { useEffect, useRef } from "react";

export default function useClickOutside(
  elements: (HTMLElement | null | undefined)[],
  onClickOutside: () => void,
) {
  const elementsRef = useRef<(HTMLElement | null | undefined)[]>(elements);
  const handlerRef = useRef(onClickOutside);

  useEffect(() => {
    elementsRef.current = elements;
    handlerRef.current = onClickOutside;
  }, [elements, onClickOutside]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if the click is outside all registered elements
      const clickedInside = elementsRef.current.some(
        (el) => el && el.contains(target),
      );

      if (!clickedInside) {
        handlerRef.current();
      }
    };

    document.addEventListener("mousedown", handleClick, true);

    return () => {
      document.removeEventListener("mousedown", handleClick, true);
    };
  }, []);
}
