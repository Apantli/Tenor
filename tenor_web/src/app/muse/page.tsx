"use client";

import { useEffect, useState } from "react";
import { LineChart } from "~/lib/components/LineChart";

type BrainwaveDataPoint = {
  date: string;
  Delta: number;
  Theta: number;
  Alpha: number;
  Beta: number;
  Gamma: number;
};

export default function Muse() {
  const [data, setData] = useState<BrainwaveDataPoint[]>([]);
  const brainwaves = ["Delta", "Theta", "Alpha", "Beta", "Gamma"];

  useEffect(() => {
    const eventSource = new EventSource("/api/muse_data");

    eventSource.onmessage = (event) => {
      const serverData = JSON.parse(event.data);
      const date = new Date(serverData.timestamp).toLocaleTimeString();
      const newDataPoint = {
        date,
        Delta: serverData.signals.delta,
        Theta: serverData.signals.theta,
        Alpha: serverData.signals.alpha,
        Beta: serverData.signals.beta,
        Gamma: serverData.signals.gamma,
      };

      setData((prevData) => {
        const newData = [...prevData, newDataPoint];
        return newData.slice(-100);
      });
    };

    return () => eventSource.close();
  }, []);

  return (
    <div>
      <h1>Muse Biometric Data</h1>
      <LineChart
        className="h-80"
        data={data}
        index="date"
        categories={brainwaves}
        valueFormatter={(number: number) => `${number.toFixed(1)}`}
        xAxisLabel="Time"
        yAxisLabel="dB"
        onValueChange={() => {}}
        colors={["red", "violet", "cyan", "emerald", "amber"]}
      />
    </div>
  );
}
