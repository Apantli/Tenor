import Table, { TableColumns } from "../table/Table";
import { Size } from "~/lib/types/firebaseSchemas";
import InputTextField from "../inputs/InputTextField";

interface SizeCol {
  id: string; // id must be a string to match the API response
  name: Size;
  value: number;
  color: string;
}

export default function SettingsSizeTable({
  sizeData,
  setSizeData,
}: {
  sizeData: SizeCol[];
  setSizeData: React.Dispatch<React.SetStateAction<SizeCol[]>>;
}
) {
  const handleValueChange = (id: string, newValue: number) => {
    if (newValue < 0 || isNaN(newValue)) return;

    setSizeData((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx === -1) return prev;

      const updated = [...prev];
      updated[idx] = { 
        ...updated[idx], 
        id: updated[idx]?.id ?? "", 
        name: updated[idx]?.name ?? {} as Size, 
        color: updated[idx]?.color ?? "#000000", 
        value: newValue 
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
      label: "Value",
      width: 80,
      render(row) {
        return (
          <InputTextField
            type="text"
            labelClassName="text-lg font-semibold"
            inputMode="numeric"
            min={0}
            pattern="[0-9]*"
            className="w-full border border-gray-300 rounded px-2 py-1"
            value={row.value}
            onChange={(e) => handleValueChange(row.id, Number(e.target.value))}
            disableAI = {true}
          />
        );
      },
    },
  };

  return (
    <div className="space-y-4  max-w-[220px]">
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
