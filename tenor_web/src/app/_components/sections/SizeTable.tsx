import { useEffect, useState } from "react";
import Table, { TableColumns } from "../table/Table";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { Size } from "~/lib/types/firebaseSchemas";
import PrimaryButton from "../buttons/PrimaryButton";

interface SizeCol {
  id: string; // id debe ser obligatorio
  name: Size;
  value: number;
  color: string;
}

const SIZE_ORDER: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZE_COLORS: Record<Size, string> = {
  XS: "#4A90E2",
  S: "#2c9659",
  M: "#a38921",
  L: "#E67E22",
  XL: "#E74C3C",
  XXL: "#8E44AD",
};

export default function SettingsSizeTable() {
  const { projectId } = useParams() as { projectId: string };

  const { data: projectSettings } = api.settings.getSizeTypes.useQuery({
    projectId,
  }) as { data: number[] | undefined };

  const [sizeData, setSizeData] = useState<SizeCol[]>([]);
  const changeSizeMutation = api.settings.changeSize.useMutation();

  useEffect(() => {
    if (Array.isArray(projectSettings)) { 
      const list = projectSettings as number[];  
      const mapped = SIZE_ORDER.map((sizeName, index) => ({
        id: `${sizeName}-${index}`, 
        name: sizeName,
        color: SIZE_COLORS[sizeName],
        value: list[index] ?? index, 
      }));
      setSizeData(mapped);
    }
  }, [projectSettings]);

  const handleValueChange = (id: string, newValue: number) => {
    if (newValue < 0 || isNaN(newValue)) return;

    setSizeData((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx === -1) return prev;

      const prevValue = idx > 0 ? prev[idx - 1]?.value ?? -Infinity : -Infinity;
      const nextValue = idx < prev.length - 1 ? prev[idx + 1]?.value ?? Infinity : Infinity;

      if (newValue <= prevValue || newValue >= nextValue) return prev;

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

  const handleSave = () => {
    const newSizes = sizeData.map((s) => s.value);
    changeSizeMutation.mutate({ projectId, size: newSizes });
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
          <input
            type="number"
            min={0}
            className="w-full border border-gray-300 rounded px-2 py-1"
            value={row.value}
            onChange={(e) => handleValueChange(row.id, Number(e.target.value))}
          />
        );
      },
    },
  };

  return (
    <div className="space-y-4">
      <Table
        className="w-sml max-w-[220px]"
        data={sizeData}
        columns={tableColumns}
        tableKey="size-table"
        rowClassName="h-12"
      />
      <PrimaryButton
        onClick={handleSave}
        className="w-full"
      >
        Guardar Cambios
      </PrimaryButton>
    </div>
  );
}
