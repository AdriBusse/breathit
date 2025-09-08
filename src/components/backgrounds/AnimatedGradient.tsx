"use client";

import * as React from "react";

type AnimatedGradientProps = {
  // When mode is "session" we crossfade between green/blue using `mix`.
  // When mode is "idle" we render a neutral dark gradient that does not change.
  mode?: "idle" | "session";
  // 0 = fully green layer, 1 = fully blue layer. Values in-between crossfade smoothly.
  mix?: number;
};

// Light-weight animated gradient background with crossfade between palettes.
export default function AnimatedGradient({ mode = "idle", mix = 0 }: AnimatedGradientProps) {
  const clampMix = Math.max(0, Math.min(1, mix));
  const green = { c1: "#10b981", c2: "#14b8a6" }; // emerald ↔ teal
  const blue = { c1: "#3b82f6", c2: "#6366f1" }; // blue ↔ indigo

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {mode === "session" ? (
        <>
          {/* Green layer */}
          <div
            className="absolute inset-0 animate-[gradmove_18s_ease-in-out_infinite_alternate] transition-opacity duration-700"
            style={{
              opacity: 1 - clampMix,
              background:
                `radial-gradient(1200px 800px at 20% 30%, ${green.c1}30, transparent 60%),` +
                `radial-gradient(900px 700px at 80% 70%, ${green.c2}25, transparent 55%),` +
                "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,0))",
            } as React.CSSProperties}
          />
          {/* Blue layer */}
          <div
            className="absolute inset-0 animate-[gradmove_18s_ease-in-out_infinite_alternate] transition-opacity duration-700"
            style={{
              opacity: clampMix,
              background:
                `radial-gradient(1200px 800px at 20% 30%, ${blue.c1}30, transparent 60%),` +
                `radial-gradient(900px 700px at 80% 70%, ${blue.c2}25, transparent 55%),` +
                "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,0))",
            } as React.CSSProperties}
          />
        </>
      ) : (
        // Neutral dark gradient for idle/mode/time screens
        <div
          className="absolute inset-0 animate-[gradmove_18s_ease-in-out_infinite_alternate]"
          style={{
            background:
              "radial-gradient(1100px 700px at 20% 30%, rgba(255,255,255,0.04), transparent 60%)," +
              "radial-gradient(900px 600px at 80% 70%, rgba(255,255,255,0.03), transparent 55%)," +
              "linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,0))",
          } as React.CSSProperties}
        />
      )}
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_50%_-100px,rgba(255,255,255,.10),transparent)]" />
      <style jsx global>{`
        @keyframes gradmove {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            filter: saturate(1);
          }
          50% {
            transform: translate3d(-2%, 1%, 0) scale(1.02);
            filter: saturate(1.05);
          }
          100% {
            transform: translate3d(2%, -1%, 0) scale(1.03);
            filter: saturate(1.05);
          }
        }
      `}</style>
    </div>
  );
}
