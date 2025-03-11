"use client";

import { useState, useEffect, useRef } from "react";

export default function SpeechApp() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [language, setLanguage] = useState<string>("en-US");

  const recognition = useRef<SpeechRecognition | null>(null);

  // Test lenguages
  const languages = [
    { code: "en-US", name: "English (US)" },
    { code: "es-ES", name: "Spanish (ES)" },
    { code: "fr-FR", name: "French (FR)" },
    { code: "de-DE", name: "German (DE)" },
    { code: "it-IT", name: "Italian (IT)" },
    { code: "ja-JP", name: "Japanese (JP)" },
  ];

  // Initialize SpeechRecognition
  if (typeof window !== "undefined") {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI && !recognition.current) {
      recognition.current = new SpeechRecognitionAPI();
    }
  }

  useEffect(() => {
    const currentRecognition = recognition.current;
    if (!currentRecognition) {
      setError("Speech Recognition is not supported in this browser.");
      return;
    }

    currentRecognition.continuous = true;
    currentRecognition.interimResults = false;
    currentRecognition.lang = language;

    currentRecognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const text = result?.[0]?.transcript ?? "";
      setTranscript((prev) => (prev ? `${prev} ${text}` : text));
    };

    currentRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Error: ${event.error}`);
    };

    return () => {
      currentRecognition.abort();
    };
  }, []);

  // Update language when changed
  useEffect(() => {
    if (recognition.current) {
      recognition.current.lang = language;
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    } else {
      recognition.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="m-6">
      <h1 className="text-2xl font-bold text-app-text">
        Multilingual Speech Recognition
      </h1>

      {error && <p className="text-red-500">{error}</p>}

      <div className="mt-3 flex items-center gap-x-3 align-middle">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-48 rounded border py-2"
          disabled={isListening}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-md bg-app-primary p-2 text-white transition"
          onClick={toggleListening}
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
      </div>

      <div className="mt-6 w-full max-w-2xl rounded bg-white p-4 shadow">
        <h2 className="text-lg font-semibold">Recognized Speech:</h2>
        <p className="mt-2 whitespace-pre-wrap text-gray-700">
          {transcript || "No speech detected yet..."}
        </p>
      </div>
    </div>
  );
}
