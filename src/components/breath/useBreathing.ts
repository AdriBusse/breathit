"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Phase = "inhale" | "hold" | "exhale" | "hold2";

export type BreathingConfig = {
  inhaleMs: number;
  holdMs: number;
  exhaleMs: number;
  totalMs: number; // total session duration
};

export function useBreathing(config: BreathingConfig | null) {
  const [phase, setPhase] = useState<Phase>("inhale");
  const [running, setRunning] = useState(false);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [currentRemaining, setCurrentRemaining] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const frameRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const phaseRemainingRef = useRef(0);
  const totalRemainingRef = useRef(0);
  const phaseOrder: Phase[] = ["inhale", "hold", "exhale", "hold2"]; // loop

  const phaseDuration = useCallback(
    (p: Phase) =>
      p === "inhale"
        ? config?.inhaleMs ?? 0
        : p === "hold" || p === "hold2"
        ? config?.holdMs ?? 0
        : config?.exhaleMs ?? 0,
    [config]
  );

  const start = useCallback(() => {
    if (!config) return;
    setPhase("inhale");
    setRunning(true);
    setCyclesCompleted(0);
    phaseRemainingRef.current = config.inhaleMs;
    totalRemainingRef.current = config.totalMs;
    setCurrentRemaining(config.inhaleMs);
    setTotalRemaining(config.totalMs);
    lastTsRef.current = null;
  }, [config]);

  const stop = useCallback(() => {
    setRunning(false);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    lastTsRef.current = null;
  }, []);

  const advancePhase = useCallback(() => {
    setPhase((prev) => {
      const idx = phaseOrder.indexOf(prev);
      const next = phaseOrder[(idx + 1) % phaseOrder.length];
      // Count a cycle as: inhale -> hold -> exhale
      if (prev === "exhale") setCyclesCompleted((c) => c + 1);
      phaseRemainingRef.current = phaseDuration(next);
      setCurrentRemaining(phaseRemainingRef.current);
      return next;
    });
  }, [phaseDuration]);

  // Animation frame loop
  useEffect(() => {
    if (!running || !config) return;

    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const delta = ts - (lastTsRef.current ?? ts);
      lastTsRef.current = ts;

      // decrement timers
      phaseRemainingRef.current = Math.max(0, phaseRemainingRef.current - delta);
      totalRemainingRef.current = Math.max(0, totalRemainingRef.current - delta);

      setCurrentRemaining(phaseRemainingRef.current);
      setTotalRemaining(totalRemainingRef.current);

      // Ensure phase completion is processed even on the final frame
      if (phaseRemainingRef.current <= 0) {
        advancePhase();
      }

      if (totalRemainingRef.current <= 0) {
        setRunning(false);
        frameRef.current && cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [running, config, advancePhase]);

  const progress = useMemo(() => {
    // returns 0..1 progress within current phase (for motion)
    const dur = phaseDuration(phase);
    return dur > 0 ? 1 - currentRemaining / dur : 0;
  }, [currentRemaining, phase, phaseDuration]);

  return {
    phase,
    running,
    start,
    stop,
    progress,
    totalRemaining,
    currentRemaining,
    cyclesCompleted,
  };
}
