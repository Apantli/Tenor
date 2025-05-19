import { usePopupVisibilityState } from "../_components/Popup";
import { useEffect, useState } from "react";
import { useSearchParam } from "./useSearchParam";
import { useSearchParams } from "next/navigation";

export function useQueryId(paramName: string) {
  const params = useSearchParams();
  const paramValue = params?.get(paramName);
  const { setParam, resetParam } = useSearchParam();

  const setValue = (newValue: string) => {
    if (newValue === "") {
      resetParam(paramName);
    } else {
      setParam(paramName, newValue);
    }
  };

  return [paramValue, setValue] as const;
}

export default function useQueryIdForPopup(paramName: string) {
  const params = useSearchParams();
  const paramValue = params?.get(paramName);
  const { setParam, resetParam } = useSearchParam();

  const [id, setId] = useState(paramValue ?? "");
  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  const [manualShow, setManualShow] = useState(false);
  const [mount, setMount] = useState(false);

  useEffect(() => {
    if (!mount) {
      setMount(true);
    }
    setManualShow(false);
    if (paramValue) {
      setShowDetail(true);
      setId(paramValue);
    } else if (mount) {
      setShowDetail(false);
      const timeout = setTimeout(() => {
        setId("");
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [paramValue]);

  const setShowManually = (show: boolean) => {
    setShowDetail(show);
    setManualShow(true);
  };

  const setValue = (newValue: string) => {
    if (newValue === "") {
      resetParam(paramName);
    } else {
      setParam(paramName, newValue);
    }
  };

  return [
    renderDetail && (id !== "" || manualShow),
    showDetail,
    id,
    setValue,
    setShowManually,
  ] as const;
}
