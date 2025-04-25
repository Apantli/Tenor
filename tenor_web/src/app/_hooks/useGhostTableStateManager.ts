import React, { useState } from "react";

export default function useGhostTableStateManager<
  // eslint-disable-next-line
  T extends Record<string, any> & { id: I },
  I extends string | number,
>(acceptCallback: (ids: I[]) => void) {
  const [ghostData, setGhostData] = useState<T[] | undefined>();
  const [ghostRows, setGhostRows] = useState<number | undefined>();

  const onAccept = (ids: I[]) => {
    const newGhostData = ghostData?.filter((ghost) => !ids.includes(ghost.id));
    setGhostData(newGhostData);

    acceptCallback(ids);
  };

  const onReject = (ids: I[]) => {
    const newGhostData = ghostData?.filter((ghost) => !ids.includes(ghost.id));
    setGhostData(newGhostData);
  };

  const beginLoading = (rows: number) => {
    setGhostRows(rows);
    setGhostData(undefined);
  };

  const finishLoading = (data: T[]) => {
    setGhostData(data);
  };

  return [
    onAccept,
    onReject,
    beginLoading,
    finishLoading,
    ghostData,
    ghostRows,
    setGhostRows,
  ] as const;
}
