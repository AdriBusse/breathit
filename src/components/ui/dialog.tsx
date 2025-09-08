"use client";

import * as React from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full sm:w-auto sm:min-w-[360px] max-w-[520px] rounded-t-2xl sm:rounded-2xl bg-white/90 backdrop-blur-xl text-neutral-900 shadow-xl p-6">
        {children}
      </div>
    </div>
  );
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold mb-2">{children}</h2>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-neutral-700 mb-4">{children}</p>;
}

export function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex justify-end gap-2">{children}</div>;
}

