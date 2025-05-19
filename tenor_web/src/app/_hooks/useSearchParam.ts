"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

export function useSearchParam() {
  const router = useRouter();
  const pathname = usePathname();

  const getParams = () => new URLSearchParams(window.location.search);

  const getParam = useCallback((key: string): string | null => {
    return getParams().get(key);
  }, []);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = getParams();
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router],
  );

  const resetParam = useCallback(
    (key: string) => {
      const params = getParams();
      params.delete(key);
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router],
  );

  return {
    getParam,
    setParam,
    resetParam,
  };
}
