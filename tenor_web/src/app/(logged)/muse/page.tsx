/* eslint-disable */
"use client";

import { MuseClient, zipSamples } from "muse-js";
import { useMemo, useState } from "react";
import { LineChart } from "~/lib/components/LineChart";
import { api } from "~/trpc/react";
import Logs from "./logs";
const { epoch, fft, powerByBand } = require("@neurosity/pipes");

type BrainwaveDataPoint = {
  Delta: number;
  Theta: number;
  Alpha: number;
  Beta: number;
  Gamma: number;
  date: string;
};

export default function MuseBluetooth() {
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("disconnected");
  const [data, setData] = useState<BrainwaveDataPoint[]>([]);
  const brainwaves = ["Delta", "Theta", "Alpha", "Beta", "Gamma"];

  const client = useMemo(() => new MuseClient(), []);

  const logsUtil = api.useUtils().logs;
  const { mutate: generateLog } = api.logs.analyzeAndCreateLog.useMutation({
    onSuccess() {
      logsUtil.invalidate();
    },
  });

  const setupMuseConnection = async () => {
    try {
      setConnectionStatus("connecting");
      await client.connect();
      await client.start();
    } catch {
      setConnectionStatus("disconnected");
    }

    client.enableAux = true;

    client.connectionStatus.subscribe((status) => {
      setConnectionStatus(status ? "connected" : "disconnected");
    });

    zipSamples(client.eegReadings)
      .pipe(
        epoch({ duration: 1024, interval: 100, samplingRate: 256 }),
        fft({ bins: 256 }),
        powerByBand(),
      )
      .subscribe((data: any) => {
        const newDataPoint = {
          date: new Date().toLocaleTimeString(),
          Delta:
            (data.delta[0] + data.delta[1] + data.delta[2] + data.delta[3]) / 4,
          Theta:
            (data.theta[0] + data.theta[1] + data.theta[2] + data.theta[3]) / 4,
          Alpha:
            (data.alpha[0] + data.alpha[1] + data.alpha[2] + data.alpha[3]) / 4,
          Beta: (data.beta[0] + data.beta[1] + data.beta[2] + data.beta[3]) / 4,
          Gamma:
            (data.gamma[0] + data.gamma[1] + data.gamma[2] + data.gamma[3]) / 4,
        };
        setData((prevData) => {
          const newData = [...prevData, newDataPoint];
          return newData.slice(-100);
        });
      });
  };

  const disconnect = () => {
    client.disconnect();
  };

  const createLog = () => {
    generateLog();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-app-text">
        Muse brainwave information
      </h1>
      <LineChart
        className="h-80"
        data={data}
        index="date"
        categories={brainwaves}
        valueFormatter={(number: number) => `${number.toFixed(1)}`}
        xAxisLabel="Time"
        yAxisLabel="dB"
        onValueChange={() => {}}
        colors={["red", "violet", "blue", "emerald", "amber"]}
      />
      <div className="flex flex-row items-center gap-4">
        {connectionStatus != "connected" && (
          <button
            className="rounded-md bg-app-primary p-2 text-white transition"
            onClick={setupMuseConnection}
          >
            {connectionStatus == "connecting"
              ? "Connecting..."
              : "Connect Muse Headset"}
          </button>
        )}
        {connectionStatus == "connected" && (
          <button
            className="rounded-md bg-app-fail p-2 text-white transition"
            onClick={disconnect}
          >
            Disconnect
          </button>
        )}
        <button
          className="rounded-md border border-app-border p-2 text-black transition"
          onClick={createLog}
        >
          Analyze my emotion
        </button>
      </div>
      <Logs />
    </div>
  );
}
