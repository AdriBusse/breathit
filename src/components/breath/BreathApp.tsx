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

  const config = React.useMemo(() => {
    if (!mode) return null;
    const totalMs = Math.max(1, minutes) * 60 * 1000;
    return { inhaleMs: inhaleSec * 1000, holdMs: holdSec * 1000, exhaleMs: exhaleSec * 1000, totalMs };
  }, [mode, minutes, inhaleSec, holdSec, exhaleSec]);

  const { phase, running, start, stop, progress, totalRemaining, cyclesCompleted } = useBreathing(config);

  // Start session when entering the session step
  React.useEffect(() => {
    if (step === "session" && config) {
      start();
    }
  }, [step, config, start]);

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
    if (running) sessionStartedRef.current = true;
  }, [step, running]);

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

  // Capture the cycles shown in the popup for consistent save
  React.useEffect(() => {
    if (finished) setFinalCycles(cyclesCompleted);
  }, [finished, cyclesCompleted]);

  React.useEffect(() => {
    if (!finished || !config || savedThisSessionRef.current === true) return;
    const record: SessionRecord = {
      id: cryptoRandomId(),
      date: new Date().toISOString(),
      cycles: finalCycles,
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
  }, [finished, config, finalCycles, mode, inhaleSec, holdSec, exhaleSec]);

  // Confetti when the summary dialog opens
  React.useEffect(() => {
    if (!finished || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
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
            Total remaining: <strong className="tabular-nums">{msToClock(totalRemaining)}</strong>
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
              Start Breathing
            </button>
            <p className="mt-6 text-white/80 text-center text-sm">
              Learn to breathe well with a gentle guided practice.
            </p>

            {/* History list */}
            {history.length > 0 && (
              <div className="mt-10 w-full max-w-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white/80">History</h3>
                  <button
                    className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white/90"
                    onClick={() => setConfirmClearOpen(true)}
                    aria-label="Clear history"
                  >
                    <TrashIcon className="size-4" />
                    Clear
                  </button>
                </div>
                <div className={history.length > 10 ? "max-h-56 overflow-y-auto pr-1" : undefined}>
                  <ul className="space-y-1.5" aria-label="Sessions history">
                    {history.map((h) => (
                      <li key={h.id} className="text-xs text-white/70 flex items-center justify-between">
                        <span className="tabular-nums">
                          {formatLocalDateTime(h.date)}
                        </span>
                        <span className="tabular-nums">
                          {msToMinutes(h.totalMs)}m • {h.cycles} cycles
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
            <h2 className="text-2xl font-semibold">Choose a mode</h2>
            <Card
              className="cursor-pointer overflow-hidden bg-gradient-to-br from-teal-400/40 to-emerald-400/30 hover:from-teal-400/50 hover:to-emerald-400/40"
              onClick={() => {
                setMode("health-breath");
                setStep("time");
              }}
            >
              <CardHeader>
                <CardTitle>Health Breath</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm">
                  A balanced 4-4-4 breathing pattern to calm and focus.
                </p>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("idle")}>Back</Button>
            </div>
          </div>
        )}

        {step === "time" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Practice time</h2>
            <div className="text-center">
              <label className="block mb-2 text-sm text-white/90">Total time</label>
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
                <span className="font-medium">More settings</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1 text-xs text-white/80">Inhale (s)</label>
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
                    <div>
                      <label className="block mb-1 text-xs text-white/80">Hold (s)</label>
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
                    <div>
                      <label className="block mb-1 text-xs text-white/80">Exhale (s)</label>
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
                  <p className="mt-3 text-xs text-white/70">
                    Pattern: inhale → hold → exhale → hold, then repeat.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("mode")}>Back</Button>
              <Button onClick={() => setStep("session")}>Begin</Button>
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
        <DialogTitle>Great work</DialogTitle>
        <DialogDescription>
          You completed {Math.max(0, minutes)} minute{minutes !== 1 ? "s" : ""} of Health Breath.
        </DialogDescription>
        <div className="text-sm text-neutral-800/90">
          <div className="flex justify-between py-1">
            <span>Total time</span>
            <span className="font-medium tabular-nums">{msToClock((config?.totalMs ?? 0))}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Cycles</span>
            <span className="font-medium">{finalCycles}</span>
          </div>
        </div>
        <DialogActions>
          <Button onClick={reset}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Stop Dialog */}
      <Dialog open={confirmStopOpen} onOpenChange={setConfirmStopOpen}>
        <DialogTitle>Stop session?</DialogTitle>
        <DialogDescription>
          Your current breathing session will end and progress won’t be saved.
        </DialogDescription>
        <DialogActions>
          <Button variant="secondary" onClick={() => setConfirmStopOpen(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmStopOpen(false);
              stop();
              setStep("idle");
            }}
          >
            Stop now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear History Dialog */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogTitle>Clear history?</DialogTitle>
        <DialogDescription>
          This removes all saved sessions from this device.
        </DialogDescription>
        <DialogActions>
          <Button variant="secondary" onClick={() => setConfirmClearOpen(false)}>Cancel</Button>
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
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function SessionView({ phase, progress, onRequestStop }: { phase: Phase; progress: number; onRequestStop: () => void }) {
  const label =
    phase === "inhale" ? "Breathe in" : phase === "exhale" ? "Breathe out" : "Keep breath";

  return (
    <div className="flex flex-col items-center">
      <SemicircleProgress phase={phase} progress={progress} />
      <div className="mt-6 text-lg font-medium tracking-wide">{label}</div>
      <Button className="mt-8 h-12 px-7 text-base font-semibold tracking-wide" variant="destructive" onClick={onRequestStop}>
        Stop
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
