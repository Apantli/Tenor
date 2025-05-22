import { useState, useEffect, useRef, useCallback } from "react";

export interface TimeWindow {
  start: number;
  end: number;
}

export interface WindowTranscript extends TimeWindow {
  transcript: string;
}

export interface UseSpeechRecognitionProps {
  timeWindows: TimeWindow[];
  currentTime: number;
  endingTime: number;
  isActive: boolean;
  onComplete?: (transcripts: WindowTranscript[]) => void;
}

export function useSpeechRecognition({
  timeWindows,
  currentTime,
  endingTime,
  isActive,
  onComplete,
}: UseSpeechRecognitionProps) {
  const [error, setError] = useState<string>("");
  const [windowTranscripts, setWindowTranscripts] = useState<
    WindowTranscript[]
  >([]);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(true);

  const recognition = useRef<SpeechRecognition | null>(null);
  const recognitionManuallyStarted = useRef<boolean>(false);
  const hasCompletedRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(currentTime);
  const windowTranscriptsRef = useRef<WindowTranscript[]>([]);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    windowTranscriptsRef.current = windowTranscripts;
  }, [windowTranscripts]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        if (!recognition.current) {
          recognition.current = new SpeechRecognitionAPI();
        }
      } else {
        setError("Speech Recognition is not supported in this browser.");
        setIsRecognitionSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    const newTranscripts = timeWindows.map((tw) => ({ ...tw, transcript: "" }));
    setWindowTranscripts(newTranscripts);
    windowTranscriptsRef.current = newTranscripts;
    hasCompletedRef.current = false;
  }, [timeWindows]);

  useEffect(() => {
    const currentRecognition = recognition.current;
    if (!currentRecognition) {
      return;
    }

    currentRecognition.continuous = true;
    currentRecognition.interimResults = false;
    currentRecognition.lang = "en-US";

    const handleResult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const newTextSegment = result?.[0]?.transcript ?? "";

      if (!newTextSegment) return;

      const currentTime = currentTimeRef.current;

      setWindowTranscripts((prevWindowTranscripts) => {
        const updated = prevWindowTranscripts.map((windowEntry) => {
          if (
            currentTime >= windowEntry.start &&
            currentTime <= windowEntry.end
          ) {
            return {
              ...windowEntry,
              transcript: (windowEntry.transcript
                ? `${windowEntry.transcript} ${newTextSegment}`
                : newTextSegment
              ).trim(),
            };
          }
          return windowEntry;
        });
        windowTranscriptsRef.current = updated;
        return updated;
      });
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        setError(`Error: ${event.error}`);
      }
      recognitionManuallyStarted.current = false;
    };

    const handleStart = () => {
      recognitionManuallyStarted.current = true;
    };

    const handleEnd = () => {
      recognitionManuallyStarted.current = false;
    };

    currentRecognition.onresult = handleResult;
    currentRecognition.onerror = handleError;
    currentRecognition.onstart = handleStart;
    currentRecognition.onend = handleEnd;

    return () => {
      if (recognitionManuallyStarted.current && currentRecognition) {
        currentRecognition.abort();
        recognitionManuallyStarted.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (currentTime >= endingTime && !hasCompletedRef.current) {
      hasCompletedRef.current = true;

      if (recognition.current && recognitionManuallyStarted.current) {
        recognition.current.stop();
      }

      if (onCompleteRef.current) {
        onCompleteRef.current(windowTranscriptsRef.current);
      }
    }
  }, [currentTime, endingTime]);

  useEffect(() => {
    const currentRec = recognition.current;
    if (!currentRec || !isRecognitionSupported) return;

    if (!isActive || currentTime >= endingTime) {
      if (recognitionManuallyStarted.current) {
        currentRec.stop();
      }
      return;
    }

    const activeWindow = timeWindows.find(
      (w) => currentTime >= w.start && currentTime < w.end,
    );

    if (activeWindow) {
      if (!recognitionManuallyStarted.current) {
        try {
          currentRec.start();
        } catch (e) {
          if (e instanceof DOMException && e.name === "InvalidStateError") {
            recognitionManuallyStarted.current = true;
          } else {
            console.error("Error starting recognition:", e);
          }
        }
      }
    } else {
      if (recognitionManuallyStarted.current) {
        currentRec.stop();
      }
    }
  }, [currentTime, isActive, timeWindows, isRecognitionSupported, endingTime]);

  const resetTranscripts = useCallback(() => {
    const newTranscripts = timeWindows.map((tw) => ({ ...tw, transcript: "" }));
    setWindowTranscripts(newTranscripts);
    windowTranscriptsRef.current = newTranscripts;
    hasCompletedRef.current = false;
    setError("");
  }, [timeWindows]);

  return {
    windowTranscripts,
    error,
    isRecognitionSupported,
    resetTranscripts,
  };
}
