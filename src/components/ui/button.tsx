"use client";

import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    const variantClasses =
      variant === "secondary"
        ? "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50"
        : variant === "ghost"
        ? "bg-transparent text-white hover:bg-white/10"
        : variant === "destructive"
        ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow hover:from-rose-700 hover:to-red-700"
        : "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow hover:from-teal-600 hover:to-emerald-600";

    const sizeClasses =
      size === "sm"
        ? "h-9 px-3 text-sm rounded-md"
        : size === "lg"
        ? "h-12 px-6 text-base rounded-xl"
        : "h-10 px-4 text-sm rounded-lg";

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center active:scale-[0.98] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export default Button;
