import { useState } from "react";

export default function useGhostTableStateManager<
  // eslint-disable-next-line
  T extends Record<string, any> & { id: I },
  I extends string | number,
>(acceptCallback: (ids: I[]) => void, rejectCallback?: (ids: I[]) => void) {
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

    if (rejectCallback) {
      rejectCallback(ids);
    }
  };

  const beginLoading = (rows: number) => {
    setGhostRows(rows);
    setGhostData(undefined);
  };

  const finishLoading = (data: T[]) => {
    setGhostData(data);
  };

  const updateGhostRow = (id: I, updater: (oldData: T) => T) => {
    if (!ghostData) return;
    const newGhostData = ghostData.map((ghost) => {
      if (ghost.id === id) {
        return updater(ghost);
      }
      return ghost;
    });
    setGhostData(newGhostData);
  };

  return {
    onAccept,
    onReject,
    beginLoading,
    finishLoading,
    ghostData,
    ghostRows,
    setGhostRows,
    updateGhostRow,
    generating: ghostRows !== undefined && ghostData === undefined,
  };
}
