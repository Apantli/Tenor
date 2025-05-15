import { useState } from "react";

export type GhostTableStateManager<
  // eslint-disable-next-line
  T extends Record<string, any> & { id: I },
  I extends string | number,
> = ReturnType<typeof useGhostTableStateManager<T, I>>;

export default function useGhostTableStateManager<
  // eslint-disable-next-line
  T extends Record<string, any> & { id: I },
  I extends string | number,
>(
  acceptCallback: (ids: I[]) => Promise<void>,
  removeRowsCallback?: (ids: I[]) => void,
) {
  const [ghostData, setGhostData] = useState<T[] | undefined>();
  const [ghostRows, setGhostRows] = useState<number | undefined>();

  const onAccept = async (ids: I[]) => {
    const newGhostData = ghostData?.filter((ghost) => !ids.includes(ghost.id));
    setGhostData(newGhostData);

    await acceptCallback(ids);
    if (removeRowsCallback) {
      removeRowsCallback(ids);
    }
  };

  const onAcceptAll = async () => {
    if (!ghostData) return;
    const ids = ghostData.map((ghost) => ghost.id);
    await onAccept(ids);
  };

  const onReject = (ids: I[]) => {
    const newGhostData = ghostData?.filter((ghost) => !ids.includes(ghost.id));
    setGhostData(newGhostData);

    if (removeRowsCallback) {
      removeRowsCallback(ids);
    }
  };

  const onRejectAll = async () => {
    if (!ghostData) return;
    const ids = ghostData.map((ghost) => ghost.id);
    onReject(ids);
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
    onAcceptAll,
    onReject,
    onRejectAll,
    beginLoading,
    finishLoading,
    ghostData,
    ghostRows,
    setGhostRows,
    updateGhostRow,
    generating: ghostRows !== undefined && ghostData === undefined,
  };
}
