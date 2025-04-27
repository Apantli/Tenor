import { useEffect, useRef } from "react";

type Phase = {
  type: "pause" | "burst";
  len: number; // milliseconds
  startPct: number; // 0‑100
  endPct: number; // 0‑100
};

const randBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

function buildPhases(duration: number): Phase[] {
  const raw: Phase[] = [];
  let elapsed = 0;
  let pct = 0;

  while (elapsed < duration && pct < 100) {
    /* burst */
    const burstLen = randBetween(100, 1000);
    const advance = randBetween(5, 25);
    const nextPct = Math.min(pct + advance, 100);
    raw.push({
      type: "burst",
      len: burstLen,
      startPct: pct,
      endPct: nextPct,
    });
    elapsed += burstLen;
    pct = nextPct;

    /* pause */
    const pauseLen = randBetween(150, 300);
    raw.push({ type: "pause", len: pauseLen, startPct: pct, endPct: pct });
    elapsed += pauseLen;
  }

  /* ensure we finish at the hang value % */
  if (pct < 100) {
    const leftover = duration - elapsed;
    raw.push({
      type: "burst",
      len: Math.max(leftover, 150),
      startPct: pct,
      endPct: 100,
    });
  }

  const total = raw.reduce((sum, p) => sum + p.len, 0);
  const scale = duration / total;
  return raw.map((p) => ({ ...p, len: p.len * scale }));
}

interface Options {
  duration: number; // in ms
  hangAt?: number; // percentage to hang at
  update: (pct: number) => void;
}

export default function useStutterLoading({
  duration,
  update,
  hangAt,
}: Options) {
  const phasesRef = useRef<Phase[]>([]);
  const phaseIdxRef = useRef<number>(0);
  const phaseStartRef = useRef<number | null>(null);

  const hangAtValue = (hangAt ?? 90) + Math.random() * 10 - 5;
  const hasFinished = useRef(false);

  useEffect(() => {
    phasesRef.current = buildPhases(duration);
    phaseIdxRef.current = 0;
    phaseStartRef.current = null;
    hasFinished.current = false;
    update(0);

    let rafId: number;

    const loop = (time: number): void => {
      if (hasFinished.current) {
        cancelAnimationFrame(rafId);
        return;
      }
      const phases = phasesRef.current;
      const idx = phaseIdxRef.current;
      const phase = phases[idx];
      if (!phase) return;

      if (phaseStartRef.current === null) phaseStartRef.current = time;
      const localElapsed = time - phaseStartRef.current;
      const t = Math.min(localElapsed / phase.len, 1); // 0‑1 within phase

      /* progress for this frame */
      const pct =
        phase.type === "pause"
          ? phase.startPct
          : phase.startPct + (phase.endPct - phase.startPct) * easeOutQuad(t);

      /* phase change */
      if (t >= 1) {
        phaseIdxRef.current += 1;
        phaseStartRef.current = time;
      }

      update(pct);
      if (pct < hangAtValue) {
        rafId = requestAnimationFrame(loop);
      } else if (pct > hangAtValue) {
        update(hangAtValue);
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return () => {
    hasFinished.current = true;
    update(100);
  };
}
