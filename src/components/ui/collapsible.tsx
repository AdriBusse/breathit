"use client";

import * as React from "react";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const CollapsibleCtx = React.createContext<Ctx | null>(null);

export function Collapsible({
  open,
  onOpenChange,
  children,
  className = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useMemo(() => ({ open, setOpen: onOpenChange }), [open, onOpenChange]);
  return (
    <CollapsibleCtx.Provider value={ctx}>
      <div className={className}>{children}</div>
    </CollapsibleCtx.Provider>
  );
}

export function CollapsibleTrigger({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(CollapsibleCtx);
  if (!ctx) return null;
  return (
    <button
      type="button"
      aria-expanded={ctx.open}
      onClick={() => ctx.setOpen(!ctx.open)}
      className={`w-full inline-flex items-center ${className}`}
    >
      {children}
    </button>
  );
}

export function CollapsibleContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(CollapsibleCtx);
  if (!ctx) return null;
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out ${className}`}
      style={{ gridTemplateRows: ctx.open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
