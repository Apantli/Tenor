"use client";

import React, { useEffect, useRef, useState } from "react";
import Popup from "~/app/_components/Popup";
import SoundPlayer from "~/app/_components/SoundPlayer";
import MusicIcon from "@mui/icons-material/Headphones";
import SecondaryButton from "~/app/_components/buttons/SecondaryButton";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { useAlert } from "~/app/_hooks/useAlert";

import { zipSamples, channelNames, MuseClient } from "muse-js";
import { powerByBand, epoch, fft } from "@neurosity/pipes";
import {
  ChannelPowerData,
  createElectrodeQualityInferer,
} from "./electrodeQuality";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
}

export default function ConversationPopup({ showPopup, setShowPopup }: Props) {
  // REACT
  const [step, setStep] = useState(0);
  const [connectingMuse, setConnectingMuse] = useState(false);
  const [headsetConnected, setHeadsetConnected] = useState(false);

  const [electrodeQuality, setElectrodeQuality] = useState<
    Record<(typeof channelNames)[number], string>
  >({
    TP9: "N/A",
    AF7: "N/A",
    AF8: "N/A",
    TP10: "N/A",
  });

  const { alert } = useAlert();

  const museClientRef = React.useRef<MuseClient | null>(null);

  // TRPC

  // GENERAL

  // MUSE CALLBACKS
  const museConnectionCallback = (status: boolean) => {
    if (!status) {
      alert("We're sorry...", "Muse headset got disconnected.", {
        type: "error",
        duration: 5000,
      });
      setHeadsetConnected(false);
    }
  };

  const electrodeNames = ["TP9", "AF7", "AF8", "TP10"];

  const museEEGDataCallback = (data: any) => {
    const newElectrodeQuality = { ...electrodeQuality };
    for (let i = 0; i < electrodeNames.length; i++) {
      const channelPowerData = [
        data.delta[i],
        data.theta[i],
        data.alpha[i],
        data.beta[i],
        data.gamma[i],
      ];
      newElectrodeQuality[electrodeNames[i]!] = inferElectrodeQuality(
        channelPowerData as ChannelPowerData,
        electrodeNames[i]!,
      );
    }
    setElectrodeQuality(newElectrodeQuality);
  };

  const powerHistoryRef = useRef({}); // Ref to store mutable power history

  // HANDLES
  const handleDismiss = () => {
    setShowPopup(false);
    museClientRef.current?.connectionStatus.unsubscribe();
    museClientRef.current?.disconnect();
  };

  const { inferElectrodeQuality, resetHistory } =
    createElectrodeQualityInferer();

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handleConnectHeadset = async () => {
    museClientRef.current = new MuseClient();
    setConnectingMuse(true);
    try {
      await museClientRef.current.connect();
      setStep(2);
      setHeadsetConnected(true);
      await museClientRef.current.start();

      museClientRef.current.connectionStatus.subscribe(museConnectionCallback);
      zipSamples(museClientRef.current.eegReadings)
        .pipe(
          epoch({ duration: 1024, interval: 100, samplingRate: 256 }),
          fft({ bins: 256 }),
          powerByBand(),
        )
        .subscribe(museEEGDataCallback);
    } catch {
      alert(
        "We're sorry...",
        "Failed to connect to Muse headset, please try again.",
        {
          type: "error",
          duration: 5000,
        },
      );
    } finally {
      setConnectingMuse(false);
    }
  };

  const isChromium =
    navigator.userAgent.includes("Chrome") ||
    navigator.userAgent.includes("Chromium");

  return (
    <Popup
      show={showPopup}
      size="small"
      className="h-[700px] max-h-[min(700px,calc(100vh-40px))] w-[700px] max-w-[min(700px,calc(100vw-40px))]"
      dismiss={handleDismiss}
      reduceTopPadding
      footer={
        <>
          {step === 0 && (
            <SecondaryButton onClick={handleDismiss}>
              No, thank you
            </SecondaryButton>
          )}
        </>
      }
      title={
        <>
          <h1 className="mb-4 text-3xl">
            <span className="font-semibold">Conversation</span>
          </h1>
        </>
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        {step === 0 && (
          <>
            <span className="text-[100px]">
              <MusicIcon className="my-4 text-app-primary" fontSize="inherit" />
            </span>
            <h1 className="text-2xl font-semibold">
              Welcome to conversation mode
            </h1>
            <p className="max-w-[600px] text-center text-xl">
              Fill out your happiness report in a more fun and interactive way
              by talking instead of typing. It only takes 5 minutes!
            </p>
            <PrimaryButton className="mt-4 px-10" onClick={handleNextStep}>
              Get started
            </PrimaryButton>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold">
              Great, let's get started!
            </h1>
            <p className="max-w-[600px] text-center text-xl">
              {isChromium
                ? "Do you have a Muse headset? If so, please turn it on, put it on and press the button below to connect to it."
                : "Unfortunately, your browser does not support connecting to the Muse headset. Please use a Chromium based browser like Chrome or Edge if you want to use it."}
            </p>
            <img src="/muse_headset.png" className="my-10 h-36" />
            <div className="flex gap-2">
              <SecondaryButton
                onClick={() => {
                  setStep(3);
                }}
              >
                I don't have one
              </SecondaryButton>
              <PrimaryButton
                className="px-10"
                onClick={handleConnectHeadset}
                disabled={!isChromium}
                loading={connectingMuse}
              >
                Connect headset
              </PrimaryButton>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold">
              Perfect, let's get calibrated!
            </h1>
            <p className="max-w-[600px] text-center text-xl">
              Please put your headset on and wait until the sensors are placed
              correctly. We'll let you know when you're ready to go!
            </p>
            <img src="/muse_sensors.png" className="h-80" />
            <div className="flex flex-col gap-2">
              {Object.entries(electrodeQuality).map(([key, value]) => (
                <div
                  key={key}
                  className="flex w-full items-center justify-between"
                >
                  <span className="text-lg font-semibold">{key}</span>
                  <span
                    className={`rounded-full px-4 py-1 text-sm font-semibold ${
                      value === "Good"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Popup>
  );
}
