"use client";

import * as React from "react";

export type NumberStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string; // e.g., "m" or "s"
  className?: string;
  size?: "sm" | "md";
  variant?: "framed" | "bare"; // bare = only number text
  numberTone?: "primary" | "default";
};

export default function NumberStepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  suffix,
  className = "",
  size = "md",
  variant = "framed",
  numberTone = "default",
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      dec();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      inc();
    }
  };

  const btnSize = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const valueBox =
    size === "sm"
      ? "min-w-[96px] rounded-lg px-3 py-1.5 text-base"
      : "min-w-[140px] rounded-xl px-4 py-2 text-2xl";

  const valueBase =
    variant === "bare"
      ? "bg-transparent border-transparent"
      : "bg-white/10 border border-white/15 backdrop-blur-sm";

  const numberStyle =
    numberTone === "primary"
      ? "bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent"
      : "text-white/95";

  return (
    <div className={`w-full flex items-center justify-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={dec}
        aria-label="Decrease"
        className={`${btnSize} shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}
      >
        <MinusIcon className="mx-auto size-5" />
      </button>
      <div
        role="spinbutton"
        aria-valuenow={value}
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={`flex-1 select-none text-center font-semibold ${valueBox} ${valueBase}`}
      >
        <span className={`tabular-nums ${numberStyle}`}>{value}</span>
        {suffix ? (
          <span className="ml-1 text-white/70 text-sm align-middle">{suffix}</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={inc}
        aria-label="Increase"
        className={`${btnSize} shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}
      >
        <PlusIcon className="mx-auto size-5" />
      </button>
    </div>
  );
}

function MinusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
