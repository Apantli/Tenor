"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useSearchParam() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!searchParams) {
    throw new Error("useSearchParams is not available");
  }

  const getParam = (key: string): string | null => {
    return searchParams.get(key);
  };

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const resetParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  return {
    getParam,
    setParam,
    resetParam,
  };
}
