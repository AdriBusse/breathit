"use client";

import * as React from "react";
import AnimatedGradient from "@/components/backgrounds/AnimatedGradient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogActions, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import NumberStepper from "@/components/ui/number-stepper";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useBreathing, Phase } from "@/components/breath/useBreathing";
import { useI18n } from "@/components/i18n/I18nProvider";
// Safe Plausible helper (no-op if not available)
function track(event: string, props?: Record<string, any>) {
  try {
    (window as any)?.plausible?.(event, props ? { props } : undefined);
  } catch {}
}
import confetti from "canvas-confetti";

type Step = "idle" | "mode" | "time" | "session";

const PHASE_ACCENTS: Record<Phase, string> = {
  inhale: "#10b981", // emerald-500
  hold: "#3b82f6", // blue-500
  exhale: "#10b981", // emerald-500
  hold2: "#3b82f6", // blue-500
};

function msToClock(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function BreathApp() {
  const { t } = useI18n();
  const [step, setStep] = React.useState<Step>("idle");
  const [mode, setMode] = React.useState<"health-breath">();
  const [minutes, setMinutes] = React.useState<number>(5);
  const [confirmStopOpen, setConfirmStopOpen] = React.useState(false);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [inhaleSec, setInhaleSec] = React.useState(4);
  const [holdSec, setHoldSec] = React.useState(4);
  const [exhaleSec, setExhaleSec] = React.useState(4);
  const [history, setHistory] = React.useState<SessionRecord[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);
  const savedThisSessionRef = React.useRef(false);
  const confettiFiredRef = React.useRef(false);
  const [finalCycles, setFinalCycles] = React.useState(0);
  const sessionStartedRef = React.useRef(false);
  const startReportedRef = React.useRef(false);
  // Sounds
  const [availableSounds, setAvailableSounds] = React.useState<string[]>([]);
  const [selectedSound, setSelectedSound] = React.useState<string>("gong.mp3");
  const previewRef = React.useRef<HTMLAudioElement | null>(null);
  const cycleSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const endSoundRef = React.useRef<HTMLAudioElement | null>(null);
  // Audio unlock + WebAudio fallback for strict browsers (Safari/Firefox)
  const audioUnlockedRef = React.useRef(false);
  const audioCtxRef = React.useRef<any>(null);
  // Phase tracking for sound cues
  const prevPhaseRef = React.useRef<Phase | null>(null);
  const cuePlayedRef = React.useRef(false);

  const config = React.useMemo(() => {
    if (!mode) return null;
    const totalMs = Math.max(1, minutes) * 60 * 1000;
    return { inhaleMs: inhaleSec * 1000, holdMs: holdSec * 1000, exhaleMs: exhaleSec * 1000, totalMs };
  }, [mode, minutes, inhaleSec, holdSec, exhaleSec]);

  const { phase, running, start, stop, progress, totalRemaining, currentRemaining, cyclesCompleted } = useBreathing(config);

  // Start session when entering the session step
  React.useEffect(() => {
    if (step === "session" && config) {
      // reset phase tracker for new session to avoid spurious sound
      prevPhaseRef.current = null;
      cuePlayedRef.current = false;
      startReportedRef.current = false;
      start();
    }
  }, [step, config, start]);

  // Load available cycle sounds from API (fallback to default if failed)
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/sounds");
        const data = (await res.json()) as { sounds?: string[] };
        if (!cancelled) {
          const list = Array.isArray(data.sounds) && data.sounds.length > 0 ? data.sounds : ["gong.mp3"];
          setAvailableSounds(list);
          // Ensure selected is valid
          setSelectedSound((prev) => (list.includes(prev) ? prev : "gong.mp3"));
        }
      } catch {
        if (!cancelled) {
          setAvailableSounds(["gong.mp3"]);
          setSelectedSound("gong.mp3");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep reusable audio element for cycle sound in sync with selectedSound
  React.useEffect(() => {
    // If turned off, clear audio element to prevent accidental playback
    if (!selectedSound) {
      if (cycleSoundRef.current) {
        try {
          cycleSoundRef.current.pause();
        } catch {}
      }
      cycleSoundRef.current = null;
      return;
    }
    if (!cycleSoundRef.current) {
      cycleSoundRef.current = new Audio();
    }
    const el = cycleSoundRef.current;
    el.src = `/sounds/cycle/${selectedSound}`;
    el.preload = "auto";
    // Ensure volume reasonable (full by default)
    el.volume = 1.0;
    // iOS-friendly: call load explicitly
    try {
      el.load();
    } catch {}
  }, [selectedSound]);

  // Preload end-of-session sound once
  React.useEffect(() => {
    if (!endSoundRef.current) {
      endSoundRef.current = new Audio("/sounds/end_meditation.mp3");
      endSoundRef.current.preload = "auto";
      try {
        endSoundRef.current.load();
      } catch {}
    }
  }, []);

  // Unlock audio on first user gesture; also set up a WebAudio context for fallback beeps
  React.useEffect(() => {
    if (audioUnlockedRef.current) return;
    const unlock = async () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      try {
        const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AC) {
          audioCtxRef.current = new AC();
          if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();
        }
      } catch {}
      // Prime <audio> elements by playing muted once
      const els: (HTMLAudioElement | null)[] = [cycleSoundRef.current, previewRef.current, endSoundRef.current];
      for (const el of els) {
        if (!el) continue;
        try {
          el.muted = true;
          el.volume = 0;
          await el.play();
          el.pause();
          el.currentTime = 0;
          el.muted = false;
          el.volume = 1;
        } catch {}
      }
      // Remove listeners after unlock
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock as any);
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("pointerdown", unlock, { passive: true } as any);
    document.addEventListener("keydown", unlock);
    document.addEventListener("touchstart", unlock as any, { passive: true } as any);
    document.addEventListener("click", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock as any);
      document.removeEventListener("click", unlock);
    };
  }, []);

  // Small WebAudio beep fallback when HTMLAudio playback is blocked
  const beep = React.useCallback((ms = 140, freq = 660) => {
    try {
      const ctx: any = audioCtxRef.current;
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.25, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
      o.start(now);
      o.stop(now + ms / 1000 + 0.02);
    } catch {}
  }, []);

  const finished =
    step === "session" &&
    sessionStartedRef.current &&
    !running &&
    (config?.totalMs ?? 0) > 0 &&
    totalRemaining <= 0;

  const reset = () => {
    setStep("idle");
    setMode(undefined);
    savedThisSessionRef.current = false;
    confettiFiredRef.current = false;
    setFinalCycles(0);
    sessionStartedRef.current = false;
  };

  // Track when a session actually starts (to avoid early "finished" flashes)
  React.useEffect(() => {
    if (step !== "session") {
      sessionStartedRef.current = false;
      return;
    }
    if (running) {
      sessionStartedRef.current = true;
      if (!startReportedRef.current) {
        startReportedRef.current = true;
        // duration reported in minutes
        track("StartHealthBreath", { duration: Math.max(1, minutes) });
      }
    }
  }, [step, running, minutes]);

  // Play cycle sound 300ms before transitions: hold -> exhale and hold2 -> inhale
  // Reset cue state when phase changes
  React.useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      prevPhaseRef.current = phase;
      cuePlayedRef.current = false;
    }
  }, [phase]);
  // Fire cue when remaining time in a hold phase drops to <= 300ms
  React.useEffect(() => {
    if (!running || !cycleSoundRef.current) return;
    if (!(phase === "hold" || phase === "hold2")) return;
    if (currentRemaining <= 300 && !cuePlayedRef.current) {
      try {
        const el = cycleSoundRef.current;
        el.currentTime = 0;
        const p = el.play();
        if (p && typeof p.then === "function") {
          p.catch(() => beep());
        }
      } catch {
        beep();
      }
      cuePlayedRef.current = true;
    }
  }, [currentRemaining, phase, running]);

  // History persistence
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SessionRecord[];
        setHistory(parsed.sort((a, b) => (a.date < b.date ? 1 : -1)));
      }
    } catch {}
  }, []);

  // When finished: snapshot cycles and save a single history entry
  React.useEffect(() => {
    if (!finished || !config || savedThisSessionRef.current === true) return;
    const cycles = cyclesCompleted; // snapshot exactly what we display
    setFinalCycles(cycles);
    // Report completion to Plausible
    track("FinnishHealthBreath", { duration: Math.max(1, minutes) });
    const record: SessionRecord = {
      id: cryptoRandomId(),
      date: new Date().toISOString(),
      cycles,
      totalMs: config.totalMs,
      mode: mode ?? "health-breath",
      inhaleMs: inhaleSec * 1000,
      holdMs: holdSec * 1000,
      exhaleMs: exhaleSec * 1000,
    };
    setHistory((prev) => {
      const next = [record, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1));
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    savedThisSessionRef.current = true;
  }, [finished, config, cyclesCompleted, mode, inhaleSec, holdSec, exhaleSec, minutes]);

  // Confetti when the summary dialog opens
  React.useEffect(() => {
    if (!finished || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    // Play end-of-session sound (fallback to beep)
    try {
      if (endSoundRef.current) {
        endSoundRef.current.currentTime = 0;
        const p = endSoundRef.current.play();
        if (p && typeof p.then === "function") p.catch(() => beep(220, 520));
      }
    } catch {
      beep(220, 520);
    }
    const colors = ["#10b981", "#14b8a6", "#3b82f6", "#6366f1"]; // green + blue palette
    const cx = 0.5;
    const cy = 0.48;
    const shoot = (x: number, y: number, angle: number, count = 60, scalar = 1) =>
      confetti({ particleCount: count, spread: 65, angle, origin: { x, y }, colors, scalar });

    // Wait one frame (and a tiny delay) so the summary dialog is mounted/visible
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        shoot(cx - 0.16, cy, 60);
        shoot(cx + 0.16, cy, 120);
        setTimeout(
          () =>
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { x: cx, y: cy - 0.05 },
              colors,
              scalar: 0.9,
            }),
          180
        );
        setTimeout(() => {
          shoot(cx - 0.24, cy + 0.02, 60, 50, 0.9);
          shoot(cx + 0.24, cy + 0.02, 120, 50, 0.9);
        }, 360);
      }, 50);
    });
    return () => cancelAnimationFrame(raf);
  }, [finished]);

  return (
    <div className="relative min-h-dvh w-full text-white">
      <AnimatedGradient
        mode={step === "session" ? "session" : "idle"}
        mix={phase === "hold" || phase === "hold2" ? 1 : 0}
      />

      {/* Top bar with small timer */}
      {step === "session" && (
        <div className="absolute top-4 left-0 right-0 text-center text-sm/6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
            {t("total_remaining")} <strong className="tabular-nums">{msToClock(totalRemaining)}</strong>
          </span>
        </div>
      )}

      {/* Center content */}
      <div className="mx-auto max-w-md px-4 pt-28 pb-16 sm:pt-32">
        {step === "idle" && (
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={() => setStep("mode")}
              className="h-36 w-36 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-lg font-semibold shadow-lg active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              {t("start")}
            </button>
            <p className="mt-6 text-white/80 text-center text-sm">
              {t("learn_more")}
            </p>

            {/* History list */}
            {history.length > 0 && (
              <div className="mt-10 w-full max-w-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white/80">{t("history")}</h3>
                  <button
                    className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white/90"
                    onClick={() => setConfirmClearOpen(true)}
                    aria-label={t("clear_history_title")}
                  >
                    <TrashIcon className="size-4" />
                    {t("clear")}
                  </button>
                </div>
                <div className={history.length > 10 ? "max-h-56 overflow-y-auto pr-1" : undefined}>
                  <ul className="space-y-1.5" aria-label={t("sessions_history_aria")}>
                    {history.map((h) => (
                      <li key={h.id} className="text-xs text-white/70 flex items-center justify-between">
                        <span className="tabular-nums">
                          {formatLocalDateTime(h.date)}
                        </span>
                        <span className="tabular-nums">
                          {msToMinutes(h.totalMs)}m • {h.cycles} {t("cycles")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "mode" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">{t("choose_mode")}</h2>
            <Card
              className="cursor-pointer overflow-hidden bg-gradient-to-br from-teal-400/40 to-emerald-400/30 hover:from-teal-400/50 hover:to-emerald-400/40"
              onClick={() => {
                setMode("health-breath");
                setStep("time");
              }}
            >
              <CardHeader>
                <CardTitle>{t("health_breath")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm">{t("health_breath_desc")}</p>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("idle")}>{t("back")}</Button>
            </div>
          </div>
        )}

        {step === "time" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">{t("practice_time")}</h2>
            <div className="text-center">
              <label className="block mb-2 text-sm text-white/90">{t("total_time")}</label>
              <NumberStepper
                value={minutes}
                onChange={(v) => setMinutes(Math.max(1, v))}
                min={1}
                max={120}
                step={1}
                suffix="min"
                variant="bare"
                numberTone="primary"
              />
            </div>

            {/* Advanced settings collapsible (no card) */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger className="-mx-1 flex items-center gap-2 px-1 py-2 text-sm text-white/80 hover:text-white">
                <Chevron open={advancedOpen} />
                <span className="font-medium">{t("more_settings")}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-1">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-full max-w-xs text-center">
                      <label className="block mb-1 text-xs text-white/80">{t("inhale_s")}</label>
                      <NumberStepper
                        value={inhaleSec}
                        onChange={(v) => setInhaleSec(Math.max(1, v))}
                        min={1}
                        max={60}
                        step={1}
                        suffix="s"
                        size="sm"
                      />
                    </div>
                    <div className="w-full max-w-xs text-center">
                      <label className="block mb-1 text-xs text-white/80">{t("hold_s")}</label>
                      <NumberStepper
                        value={holdSec}
                        onChange={(v) => setHoldSec(Math.max(1, v))}
                        min={1}
                        max={60}
                        step={1}
                        suffix="s"
                        size="sm"
                      />
                    </div>
                    <div className="w-full max-w-xs text-center">
                      <label className="block mb-1 text-xs text-white/80">{t("exhale_s")}</label>
                      <NumberStepper
                        value={exhaleSec}
                        onChange={(v) => setExhaleSec(Math.max(1, v))}
                        min={1}
                        max={60}
                        step={1}
                        suffix="s"
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block mb-1 text-xs text-white/80">{t("cycle_sound")}</label>
                    <select
                      className="w-full h-9 rounded-lg border border-white/20 bg-white/10 text-white px-3 focus:outline-none focus:ring-2 focus:ring-white/40"
                      value={selectedSound}
                      onChange={(e) => {
                        const name = e.target.value;
                        setSelectedSound(name);
                        // Play preview so user hears it (skip when off)
                        if (!name) return;
                        try {
                          if (!previewRef.current) previewRef.current = new Audio();
                          const el = previewRef.current;
                          el.src = `/sounds/cycle/${name}`;
                          el.preload = "auto";
                          el.currentTime = 0;
                          void el.play();
                        } catch {}
                      }}
                      aria-label="Select cycle sound"
                    >
                      <option value="" className="bg-neutral-900 text-white">{t("no_sound")}</option>
                      {availableSounds.map((s) => (
                        <option key={s} value={s} className="bg-neutral-900 text-white">
                          {s.replace(/\.[^.]+$/, "")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-3 text-xs text-white/70">{t("pattern_hint")}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("mode")}>{t("back")}</Button>
              <Button size="lg" className="from-teal-400 to-emerald-400" onClick={() => setStep("session")}>{t("begin")}</Button>
            </div>
          </div>
        )}

        {step === "session" && (
          <SessionView
            phase={phase}
            progress={progress}
            onRequestStop={() => setConfirmStopOpen(true)}
          />
        )}
      </div>

      {/* Summary Dialog */}
      <Dialog open={finished} onOpenChange={(o) => !o && reset()}>
        <DialogTitle>{t("great_work")}</DialogTitle>
        <DialogDescription>
          {t("completed_minutes", { minutes: Math.max(0, minutes) })}
        </DialogDescription>
        <div className="text-sm text-neutral-800/90">
          <div className="flex justify-between py-1">
            <span>{t("total_time")}</span>
            <span className="font-medium tabular-nums">{msToClock((config?.totalMs ?? 0))}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>{t("cycles")}</span>
            <span className="font-medium">{finalCycles || cyclesCompleted}</span>
          </div>
        </div>
        <DialogActions>
          <Button onClick={reset}>{t("ok")}</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Stop Dialog */}
      <Dialog open={confirmStopOpen} onOpenChange={setConfirmStopOpen}>
        <DialogTitle>{t("stop_session_title")}</DialogTitle>
        <DialogDescription>
          {t("stop_session_desc")}
        </DialogDescription>
        <DialogActions>
          <Button variant="secondary" onClick={() => setConfirmStopOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmStopOpen(false);
              stop();
              setStep("idle");
            }}
          >
            {t("stop_now")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear History Dialog */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogTitle>{t("clear_history_title")}</DialogTitle>
        <DialogDescription>
          {t("clear_history_desc")}
        </DialogDescription>
        <DialogActions>
          <Button variant="secondary" onClick={() => setConfirmClearOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="destructive"
            onClick={() => {
              try {
                localStorage.removeItem(HISTORY_KEY);
              } catch {}
              setHistory([]);
              setConfirmClearOpen(false);
            }}
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function SessionView({ phase, progress, onRequestStop }: { phase: Phase; progress: number; onRequestStop: () => void }) {
  const { t } = useI18n();
  const label = phase === "inhale" ? t("breathe_in") : phase === "exhale" ? t("breathe_out") : t("keep_breath");

  return (
    <div className="flex flex-col items-center">
      <SemicircleProgress phase={phase} progress={progress} />
      <div className="mt-6 text-lg font-medium tracking-wide">{label}</div>
      <Button className="mt-8 h-12 px-7 text-base font-semibold tracking-wide" variant="destructive" onClick={onRequestStop}>
        {t("stop")}
      </Button>
    </div>
  );
}

function SemicircleProgress({ phase, progress }: { phase: Phase; progress: number }) {
  // Map progress 0..1 within the current phase to a position along the semicircle
  // inhale: 0 -> 1, hold: stay at 1, exhale: 1 -> 0, hold2: stay at 0
  const t =
    phase === "inhale" ? progress : phase === "hold" ? 1 : phase === "exhale" ? 1 - progress : 0;

  const width = 300;
  const height = 180;
  const r = 120;
  const cx = width / 2;
  const cy = height - 10; // baseline a bit above bottom
  const leftX = cx - r;
  const rightX = cx + r;

  const pathD = `M ${leftX} ${cy} A ${r} ${r} 0 0 1 ${rightX} ${cy}`;

  // Compute point along the arc using angle interpolation (pi..0)
  const angle = Math.PI - t * Math.PI; // t:0 left pi -> t:1 right 0
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy - r * Math.sin(angle);

  return (
    <div className="w-full flex items-center justify-center select-none">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Track */}
        <path d={pathD} stroke="rgba(255,255,255,0.25)" strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* Active glow accent depends on phase */}
        <defs>
          <linearGradient id="active" x1="0" x2="1">
            <stop offset="0%" stopColor={PHASE_ACCENTS.hold2} />
            <stop offset="33%" stopColor={PHASE_ACCENTS.inhale} />
            <stop offset="66%" stopColor={PHASE_ACCENTS.hold} />
            <stop offset="100%" stopColor={PHASE_ACCENTS.exhale} />
          </linearGradient>
        </defs>
        <path d={pathD} stroke="url(#active)" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.5} />
        {/* Dot */}
        <g filter="url(#shadow)">
          <circle cx={dotX} cy={dotY} r={10} fill={PHASE_ACCENTS[phase]} />
        </g>
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`size-5 text-white/80 transition-transform ${open ? "rotate-90" : "rotate-0"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.22 14.28a.75.75 0 0 1 0-1.06L10.44 10 7.22 6.78a.75.75 0 1 1 1.06-1.06l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---- History helpers ----
type SessionRecord = {
  id: string;
  date: string; // ISO string
  cycles: number;
  totalMs: number;
  mode: string;
  inhaleMs: number;
  holdMs: number;
  exhaleMs: number;
};

const HISTORY_KEY = "breathit_history_v1";

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as any).randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatLocalDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function msToMinutes(ms: number) {
  return Math.round(ms / 60000);
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
