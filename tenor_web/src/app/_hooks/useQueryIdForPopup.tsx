import { useSearchParams } from "next/navigation";
import { usePopupVisibilityState } from "../_components/Popup";
import { useEffect, useState } from "react";

export default function useQueryIdForPopup(paramName: string) {
  const params = useSearchParams();
  const paramValue = params.get(paramName);

  const [id, setId] = useState(params.get(paramName) ?? "");
  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  const [manualShow, setManualShow] = useState(false);

  useEffect(() => {
    if (paramValue) {
      setShowDetail(true);
      setId(paramValue);
    } else {
      setShowDetail(false);
      setTimeout(() => {
        setId("");
      }, 500);
    }
    setManualShow(false);
  }, [paramValue]);

  const setShowManually = (show: boolean) => {
    setShowDetail(show);
    setManualShow(true);
  };

  return [
    renderDetail && (id !== "" || manualShow),
    showDetail,
    setShowManually,
    id,
  ] as const;
}
