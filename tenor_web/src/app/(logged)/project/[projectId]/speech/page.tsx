"use client";

import { useState, useEffect, useRef } from "react";
import { useSpeechRecognition } from "../sprint-review/SpeechToText";
import { type WindowTranscript } from "../sprint-review/SpeechToText";

// Define timeWindows with the audio segments when the user should speak
const timeWindowsConfig = [
  { start: 5, end: 10 },
  { start: 15, end: 25 },
];
const endingTimeConfig = 30; // Session ends at 40 seconds to retrieve every WindowTranscript.

export default function SpeechRecognitionTest() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedTranscripts, setCompletedTranscripts] = useState<
    WindowTranscript[]
  >([]);

  const timerIntervalId = useRef<NodeJS.Timeout | null>(null);

  const timeWindows = timeWindowsConfig;
  const endingTime = endingTimeConfig;

  const { windowTranscripts, error, isRecognitionSupported, resetTranscripts } =
    useSpeechRecognition({
      timeWindows,
      currentTime: elapsedTime,
      endingTime,
      isActive: isSessionActive && !isPaused,
      onComplete: (transcripts: WindowTranscript[]) => {
        console.log("Session completed with transcripts:", transcripts);
        setCompletedTranscripts(transcripts);
        handleStopSession();
      },
    });

  useEffect(() => {
    if (isSessionActive && !isPaused) {
      timerIntervalId.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalId.current) {
        clearInterval(timerIntervalId.current);
        timerIntervalId.current = null;
      }
    }

    return () => {
      if (timerIntervalId.current) {
        clearInterval(timerIntervalId.current);
      }
    };
  }, [isSessionActive, isPaused]);

  const handleStartSession = () => {
    setIsSessionActive(true);
    setIsPaused(false);
    setElapsedTime(0);
    setCompletedTranscripts([]);
    resetTranscripts();
  };

  const handlePauseSession = () => {
    setIsPaused(true);
  };

  const handleResumeSession = () => {
    setIsPaused(false);
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
    setIsPaused(false);
    if (timerIntervalId.current) {
      clearInterval(timerIntervalId.current);
      timerIntervalId.current = null;
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const getWindowStatus = (window: { start: number; end: number }) => {
    if (elapsedTime < window.start) return "upcoming";
    if (elapsedTime >= window.start && elapsedTime <= window.end)
      return "active";
    return "completed";
  };

  return (
    <div className="m-6 max-w-4xl">
      <h1 className="mb-6 text-3xl font-bold">Speech Recognition Test</h1>

      {!isRecognitionSupported && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          Speech Recognition is not supported in this browser.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-lg bg-gray-100 p-4">
        <h2 className="mb-2 text-xl font-semibold">Session Configuration</h2>
        <p className="text-gray-700">
          <strong>Time Windows:</strong>{" "}
          {timeWindows.map((w, i) => (
            <span key={i}>
              {formatTime(w.start)} - {formatTime(w.end)}
              {i < timeWindows.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
        <p className="text-gray-700">
          <strong>Session Duration:</strong> {formatTime(endingTime)}
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        {!isSessionActive && (
          <button
            onClick={handleStartSession}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
            disabled={!isRecognitionSupported}
          >
            Start Session
          </button>
        )}

        {isSessionActive && !isPaused && (
          <button
            onClick={handlePauseSession}
            className="rounded bg-yellow-500 px-4 py-2 font-bold text-white hover:bg-yellow-600"
          >
            Pause Session
          </button>
        )}

        {isSessionActive && isPaused && (
          <button
            onClick={handleResumeSession}
            className="rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600"
          >
            Resume Session
          </button>
        )}

        <div className="text-lg font-semibold">
          Timer: {formatTime(elapsedTime)}
          {isPaused && " (Paused)"}
        </div>
      </div>

      {isSessionActive && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold">Live Transcription</h3>
          {windowTranscripts.map((window, index) => {
            const status = getWindowStatus(window);
            return (
              <div
                key={index}
                className={`mb-4 rounded p-3 ${
                  status === "active"
                    ? "border-2 border-blue-400 bg-blue-50"
                    : status === "completed"
                      ? "bg-green-50"
                      : "bg-gray-50"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="font-semibold">
                    Window {index + 1}: {formatTime(window.start)} -{" "}
                    {formatTime(window.end)}
                  </h4>
                  <span
                    className={`rounded px-2 py-1 text-sm ${
                      status === "active"
                        ? "bg-blue-200 text-blue-800"
                        : status === "completed"
                          ? "bg-green-200 text-green-800"
                          : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <p className="text-gray-700">
                  {window.transcript ||
                    (status === "active"
                      ? "Listening..."
                      : status === "completed"
                        ? "No speech recorded"
                        : "Waiting...")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {completedTranscripts.length > 0 && (
        <div className="rounded-lg bg-green-50 p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold">
            Completed Session Results
          </h3>
          {completedTranscripts.map((window, index) => (
            <div key={index} className="mb-3 rounded bg-white p-3">
              <h4 className="font-semibold text-gray-700">
                Window {index + 1}: {formatTime(window.start)} -{" "}
                {formatTime(window.end)}
              </h4>
              <p className="text-gray-600">
                {window.transcript || "No speech recorded"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
