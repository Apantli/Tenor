"use client";

import React, { useRef, useState } from "react";
import Popup, { usePopupVisibilityState } from "~/app/_components/Popup";
import SoundPlayer from "~/app/_components/SoundPlayer";
import MusicIcon from "@mui/icons-material/Headphones";
import SecondaryButton from "~/app/_components/buttons/SecondaryButton";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { useAlert } from "~/app/_hooks/useAlert";

import { zipSamples, MuseClient } from "muse-js";
// @ts-expect-error @neurosity/pipes is a JS library without types
import { epoch, addInfo } from "@neurosity/pipes";
import { addSignalQuality } from "~/lib/eeg/addSignalQuality";
import { cn } from "~/lib/utils";
import TertiaryButton from "~/app/_components/buttons/TertiaryButton";
import PrivacyPopup from "./PrivacyPopup";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import useConfirmation from "~/app/_hooks/useConfirmation";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
}

export default function ConversationPopup({ showPopup, setShowPopup }: Props) {
  // REACT
  const [step, setStep] = useState(0);
  const [headsetStatus, setHeadsetStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [electrodesQuality, setElectrodesQuality] = useState({
    TP9: 1000,
    AF7: 1000,
    AF8: 1000,
    TP10: 1000,
  });
  const [showReadjustMessage, setShowReadjustMessage] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPause, setShowPause] = useState(false);

  const [renderPrivacy, showPrivacy, setShowPrivacy] =
    usePopupVisibilityState();

  const startTime = useRef<Date>();

  const { alert } = useAlert();
  const confirm = useConfirmation();

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
      setHeadsetStatus("disconnected");
    }
  };

  // This threshold is used as a reference to determine if the electrodes are placed correctly. If their quality is below this value, they are considered correctly placed.
  // The value was determined via trial and error, and it is not a scientific value.
  const threshold = 100;

  const museDataCallback = (data: {
    signalQuality: {
      TP9: number;
      AF7: number;
      AF8: number;
      TP10: number;
    };
  }) => {
    if (!startTime.current) {
      startTime.current = new Date();
    }
    setElectrodesQuality(data.signalQuality);
    if (
      data.signalQuality.TP9 < threshold &&
      data.signalQuality.AF7 < threshold &&
      data.signalQuality.AF8 < threshold &&
      data.signalQuality.TP10 < threshold
    ) {
      setTimeout(() => {
        setStep((prev) => (prev < 3 ? 3 : prev));
      }, 1000);
    }
    const currentTime = new Date();
    const elapsedTime = currentTime.getTime() - startTime.current.getTime();
    if (elapsedTime > 10000) {
      setShowReadjustMessage(true);
    }
  };

  // HANDLES
  const handleDismiss = () => {
    setShowPopup(false);
    museClientRef.current?.connectionStatus.unsubscribe();
    museClientRef.current?.disconnect();
  };

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handleConnectHeadset = async () => {
    museClientRef.current = new MuseClient();
    setHeadsetStatus("connecting");
    try {
      await museClientRef.current.connect();
      setStep(2);
      setHeadsetStatus("connected");
      await museClientRef.current.start();

      museClientRef.current.connectionStatus.subscribe(museConnectionCallback);
      zipSamples(museClientRef.current.eegReadings)
        .pipe(
          // eslint-disable-next-line
          epoch({ duration: 1024, interval: 100, samplingRate: 256 }),
          // eslint-disable-next-line
          addInfo({
            samplingRate: 256,
            channelNames: ["TP9", "AF7", "AF8", "TP10"],
          }),
          addSignalQuality(),
        )
        .subscribe(museDataCallback);
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
      setHeadsetStatus("disconnected");
    }
  };

  const isChromium =
    navigator.userAgent.includes("Chrome") ||
    navigator.userAgent.includes("Chromium");

  useNavigationGuard(
    async () => step > 0,
    step > 0,
    "Your progress will not be saved?",
  );

  return (
    <>
      <Popup
        show={showPopup}
        size="small"
        className="h-[700px] max-h-[min(700px,calc(100vh-40px))] w-[700px] max-w-[min(700px,calc(100vw-40px))]"
        dismiss={async () => {
          if (
            step === 0 ||
            (await confirm(
              "Are you sure?",
              "You are about to leave conversation mode and will lose all progress.",
              "Abandon conversation",
              "Keep going",
            ))
          ) {
            handleDismiss();
          }
        }}
        reduceTopPadding
        footer={
          <>
            {step === 0 && (
              <div className="flex gap-2">
                <SecondaryButton onClick={handleDismiss}>
                  No, thank you
                </SecondaryButton>
              </div>
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
                <MusicIcon
                  className="my-4 text-app-primary"
                  fontSize="inherit"
                />
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
              <p className="mt-5">
                By using Conversation Mode, you agree to the{" "}
                <TertiaryButton
                  className="ml-[-7px]"
                  onClick={() => setShowPrivacy(true)}
                >
                  privacy policy
                </TertiaryButton>
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-semibold">
                Great, let&apos;s get started!
              </h1>
              <p className="max-w-[600px] text-center text-xl">
                {isChromium
                  ? "Do you have a Muse headset? If so, please turn it on, put it on and press the button below to connect to it."
                  : "Unfortunately, your browser does not support connecting to the Muse headset. Please use a Chromium based browser like Chrome or Edge if you want to use it."}
              </p>
              <img
                src="/muse_headset.png"
                className="my-10 h-36"
                alt="Muse Headset"
              />
              <div className="flex gap-2">
                <SecondaryButton
                  onClick={() => {
                    setStep(3);
                  }}
                >
                  I don&apos;t have one
                </SecondaryButton>
                <PrimaryButton
                  className="px-10"
                  onClick={handleConnectHeadset}
                  disabled={!isChromium}
                  loading={headsetStatus === "connecting"}
                >
                  Connect headset
                </PrimaryButton>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="text-2xl font-semibold">
                Perfect, let&apos;s get calibrated!
              </h1>
              <p className="max-w-[600px] text-center text-xl">
                Please put your headset on and wait until the sensors are placed
                correctly. We&apos;ll let you know when you&apos;re ready to go!
              </p>
              <img
                src="/muse_sensors.png"
                alt="Muse Sensors"
                className="h-80"
                onClick={() => setStep(3)}
              />
              <div className="flex flex-col gap-3">
                <p className="text-center text-app-text">
                  {showReadjustMessage
                    ? "Please readjust your headset and remain still..."
                    : "Calibrating..."}
                </p>
                <div className="flex gap-5">
                  <span
                    className={cn(
                      "h-10 w-20 animate-pulse rounded-lg bg-app-fail transition",
                      {
                        "bg-app-primary": electrodesQuality.TP9 < threshold,
                      },
                    )}
                  ></span>
                  <span
                    className={cn(
                      "h-10 w-20 animate-pulse rounded-lg bg-app-fail transition",
                      {
                        "bg-app-primary": electrodesQuality.AF7 < threshold,
                      },
                    )}
                  ></span>
                  <span
                    className={cn(
                      "h-10 w-20 animate-pulse rounded-lg bg-app-fail transition",
                      {
                        "bg-app-primary": electrodesQuality.AF8 < threshold,
                      },
                    )}
                  ></span>
                  <span
                    className={cn(
                      "h-10 w-20 animate-pulse rounded-lg bg-app-fail transition",
                      {
                        "bg-app-primary": electrodesQuality.TP10 < threshold,
                      },
                    )}
                  ></span>
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div
                className={cn("flex h-[100px] flex-col gap-2 transition-all", {
                  "h-0 opacity-0": !showInstructions,
                })}
              >
                <h1 className="animate-hide-slow text-center text-2xl font-semibold text-app-primary">
                  Ready to start?
                </h1>
                <p className="mx-auto w-[450px] text-center text-lg text-app-text">
                  Click the button to begin. Remain calm, listen carefully and
                  answer truthfully. You will be able to pause the audio, if
                  needed.
                </p>
              </div>
              <div
                className={cn("flex h-[80px] flex-col gap-2 transition-all", {
                  "h-0 opacity-0": !showPause,
                })}
              >
                <h1 className="animate-hide-slow text-center text-2xl font-semibold text-app-primary">
                  Conversation paused
                </h1>
                <p className="mx-auto w-[450px] text-center text-lg text-app-text">
                  Click the play button continue from where you left off.
                </p>
              </div>
              <SoundPlayer
                soundSrc="/demo_sound.mp3"
                setPlaying={(playing) => {
                  if (playing) {
                    setShowInstructions(false);
                    setShowPause(false);
                  }
                  if (!playing) {
                    setShowPause(true);
                  }
                }}
                onFinish={() => {
                  setTimeout(() => setStep(4), 1000);
                }}
              />
            </div>
          )}
          {step === 4 && (
            <div className="flex flex-col gap-2">
              <h1 className="animate-hide-slow text-center text-2xl font-semibold text-app-primary">
                You&apos;re all set!
              </h1>
              <p className="mx-auto w-[450px] text-center text-lg text-app-text">
                You may now submit your happiness report. Thank you for trying
                out conversation mode!
              </p>
              <div className="mt-10 flex justify-center gap-2">
                <SecondaryButton>Review Answers</SecondaryButton>
                <PrimaryButton>Send report</PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </Popup>
      {renderPrivacy && (
        <PrivacyPopup setShowPopup={setShowPrivacy} showPopup={showPrivacy} />
      )}
    </>
  );
}
