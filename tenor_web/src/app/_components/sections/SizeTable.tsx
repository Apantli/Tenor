import Table, { type TableColumns } from "../table/Table";
import type { Size } from "~/lib/types/firebaseSchemas";
import InputTextField from "../inputs/InputTextField";
import { useAlert } from "~/app/_hooks/useAlert";
import { useState } from "react";

interface SizeCol {
  id: string; // id must be a string to match the API response
  name: Size;
  value: number;
  color: string;
}

const maxInputSizeNumber = 1000;

export default function SettingsSizeTable({
  sizeData,
  setSizeData,
  disabled = false,
}: {
  sizeData: SizeCol[];
  disabled?: boolean;
  setSizeData: React.Dispatch<React.SetStateAction<SizeCol[]>>;
}) {
  //Hook
  const { alert } = useAlert();

  const [numberWarningShown, setNumberWarningShown] = useState(false);

  const checkLargeNumber = (value: number) => {
    if (value < maxInputSizeNumber) return false;
    if (numberWarningShown) return true;

    alert(
      "Number too large",
      `Please only input numbers less or equal than ${maxInputSizeNumber.toLocaleString()}.`,
      {
        type: "warning",
        duration: 3000,
      },
    );
    return true;
  };

  const handleValueChange = (id: string, newValue: number) => {
    if (newValue < 0 || isNaN(newValue)) return;
    if (checkLargeNumber(newValue)) {
      setNumberWarningShown(true);
      return;
    }
    setNumberWarningShown(false);

    setSizeData((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx === -1) return prev;

      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        id: updated[idx]?.id ?? "",
        name: updated[idx]?.name ?? ({} as Size),
        color: updated[idx]?.color ?? "#000000",
        value: newValue,
      };
      return updated;
    });
  };

  const tableColumns: TableColumns<SizeCol> = {
    id: { visible: false },
    color: { visible: false },
    name: {
      label: "Size",
      width: 80,
      render(row) {
        return <div>{row.name}</div>;
      },
    },
    value: {
      label: "Story points",
      width: 100,
      render(row) {
        return (
          <InputTextField
            disabled={disabled}
            type="text"
            labelClassName="text-lg font-semibold"
            inputMode="numeric"
            min={0}
            pattern="[0-9]*"
            className="w-full rounded border border-gray-300 px-2 py-1"
            value={row.value}
            onChange={(e) => handleValueChange(row.id, Number(e.target.value))}
            disableAI={true}
          />
        );
      },
    },
  };

  return (
    <div className="max-w-[220px] space-y-4">
      <label className="text-lg font-semibold">Size Settings</label>
      <Table
        className="w-sml"
        data={sizeData}
        columns={tableColumns}
        tableKey="size-table"
        rowClassName="h-12"
      />
    </div>
  );
}
