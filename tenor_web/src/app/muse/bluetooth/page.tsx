"use client";

import { MuseClient, zipSamples } from "muse-js";
import { useMemo, useState } from "react";
import { LineChart } from "~/lib/components/LineChart";
import { map } from "rxjs/operators";

type ElectrodeDataPoint = {
  date: string;
  TP9: number;
  AF7: number;
  AF8: number;
  TP10: number;
};

export default function MuseBluetooth() {
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [data, setData] = useState<ElectrodeDataPoint[]>([]);
  const electrodes = ["TP9", "AF7", "AF8", "TP10"];

  const client = useMemo(() => new MuseClient(), []);

  const setupMuseConnection = async () => {
    await client.connect();
    await client.start();

    client.enableAux = true;

    client.connectionStatus.subscribe((status) => {
      setConnectionStatus(status);
    });

    zipSamples(client.eegReadings).subscribe((data) => {
      const newDataPoint = {
        date: new Date(data.timestamp).toLocaleTimeString(),
        TP9: data.data[0] ?? 0,
        AF7: data.data[1] ?? 0,
        AF8: data.data[2] ?? 0,
        TP10: data.data[3] ?? 0,
      };
      setData((prevData) => {
        const newData = [...prevData, newDataPoint];
        return newData.slice(-500);
      });
    });
  };

  const disconnect = () => {
    client.disconnect();
  };

  return (
    <div>
      <h1>MuseBluetooth</h1>
      <LineChart
        className="h-80"
        data={data}
        index="date"
        categories={electrodes}
        valueFormatter={(number: number) => `${number.toFixed(1)}`}
        xAxisLabel="Time"
        yAxisLabel="dB"
        onValueChange={() => {}}
        colors={["amber", "emerald", "violet", "pink"]}
      />
      {!connectionStatus && (
        <button
          className="rounded-md bg-app-primary p-2 text-white transition"
          onClick={setupMuseConnection}
        >
          Connect Muse Headset
        </button>
      )}
      {connectionStatus && (
        <button
          className="rounded-md bg-app-fail p-2 text-white transition"
          onClick={disconnect}
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
