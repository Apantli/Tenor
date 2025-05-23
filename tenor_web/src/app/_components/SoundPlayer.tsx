import React, { useEffect, useMemo, useState } from "react";
import PlayIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

interface Props {
  soundSrc: string;
  hideTime?: boolean;
  setPlaying?: (playing: boolean) => void;
  setCurrentTime?: (currentTime: number) => void;
  onFinish?: () => void;
}

export default function SoundPlayer({
  soundSrc,
  hideTime,
  setPlaying,
  onFinish,
  setCurrentTime,
}: Props) {
  const ringCount = 10;
  const rings = useMemo(
    () =>
      Array.from({ length: ringCount }, (_, i) => i).map((i) => ({
        index: i,
        size: Math.random() * 50 + 220,
        offsetX: Math.random() * 60 - 30,
        offsetY: Math.random() * 60 - 30,
        speed: Math.random() * 5 + 3,
      })),
    [],
  );

  const [playing, setPlayingInner] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const currentTimeRef = React.useRef<HTMLSpanElement>(null);
  const durationRef = React.useRef<HTMLSpanElement>(null);

  const togglePlay = async () => {
    setPlayingInner((prev) => !prev);
    setPlaying?.(!playing);
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTimeRef.current || !durationRef.current) return;

    const showTimeInUI = () => {
      if (!currentTimeRef.current || !durationRef.current) return;
      currentTimeRef.current.innerText = secondsToTime(
        Math.floor(audio.currentTime),
      );
      setCurrentTime?.(Math.floor(audio.currentTime));
      durationRef.current.innerText = secondsToTime(Math.floor(audio.duration));
    };

    const endPlaying = () => {
      setPlayingInner(false);
      onFinish?.();
    };

    const pause = () => {
      setPlayingInner(false);
      setPlaying?.(false);
    };

    const play = () => {
      setPlayingInner(true);
      setPlaying?.(true);
    };

    audio.addEventListener("timeupdate", showTimeInUI);
    audio.addEventListener("loadedmetadata", showTimeInUI);
    audio.addEventListener("ended", endPlaying);
    audio.addEventListener("pause", pause);
    audio.addEventListener("play", play);

    return () => {
      audio.removeEventListener("timeupdate", showTimeInUI);
      audio.removeEventListener("loadedmetadata", showTimeInUI);
      audio.removeEventListener("ended", endPlaying);
      audio.removeEventListener("pause", pause);
      audio.removeEventListener("play", play);
    };
  }, []);

  const secondsToTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8">
      <audio className="hidden" ref={audioRef}>
        <source src={soundSrc} type="audio/mpeg" />
      </audio>
      <div className="pointer-events-none h-[300px] w-[300px] translate-y-1/2">
        <div className="relative">
          {rings.map((ring) => (
            <div
              className="animate-spin-slow relative"
              key={ring.index}
              style={
                { "--animation-speed": `${ring.speed}s` } as React.CSSProperties
              }
            >
              <div className="animate-pulse-and-grow relative">
                <div
                  className="absolute left-1/2 top-1/2 rounded-full bg-app-primary/20 transition-[width,height] duration-[1s]"
                  style={{
                    width: playing ? `${ring.size}px` : "0px",
                    height: playing ? `${ring.size}px` : "0px",
                    transform: `translate(calc(-50% + ${ring.offsetX}px), calc(-50% + ${ring.offsetY}px))`,
                  }}
                ></div>
              </div>
            </div>
          ))}
          <div
            className="pointer-events-auto absolute left-1/2 top-1/2 flex h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-app-primary text-[100px] text-white transition hover:scale-105 active:scale-100"
            onClick={togglePlay}
          >
            {playing ? (
              <PauseIcon fontSize="inherit" />
            ) : (
              <PlayIcon fontSize="inherit" />
            )}
          </div>
        </div>
      </div>
      {!hideTime && (
        <div className="flex gap-2 text-lg">
          <span ref={currentTimeRef}>-:--</span>
          <span>/</span>
          <span ref={durationRef}>-:--</span>
        </div>
      )}
    </div>
  );
}
