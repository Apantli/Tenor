import { type SetStateAction, useState } from "react";

function usePersistentState<T>(initialValue: T, key: string) {
  const fullKey = `persistent_value:${key}`;

  // Get the value from localStorage if it exists, otherwise use the initialValue
  const [value, setValue] = useState(
    typeof localStorage !== "undefined" &&
      localStorage.getItem(fullKey) &&
      process.env.NEXT_PUBLIC_TEST_ENV !== "true"
      ? ((JSON.parse(localStorage.getItem(fullKey) ?? "") as T) ?? initialValue)
      : initialValue,
  );

  const wrappedSetValue = (newValue: T) => {
    setValue(newValue);
    if (process.env.NEXT_PUBLIC_TEST_ENV !== "true") {
      localStorage.setItem(fullKey, JSON.stringify(newValue));
    }
  };

  const resetValue = () => {
    localStorage.removeItem(fullKey);
  };

  return [
    value,
    wrappedSetValue as React.Dispatch<SetStateAction<T>>,
    resetValue,
  ] as const;
}

export default usePersistentState;
