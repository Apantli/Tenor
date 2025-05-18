import React, { useState } from "react";

function usePersistentState<T>(initialValue: T, key: string) {
  const fullKey = `persistent_value:${key}`;

  const [value, setValue] = useState(
    typeof localStorage !== "undefined" && localStorage.getItem(fullKey)
      ? ((JSON.parse(localStorage.getItem(fullKey) ?? "") as T) ?? initialValue)
      : initialValue,
  );

  const wrappedSetValue = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(fullKey, JSON.stringify(newValue));
  };

  return [value, wrappedSetValue] as const;
}

export default usePersistentState;
