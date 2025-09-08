"use client";

import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full h-11 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/60 px-3 focus:outline-none focus:ring-2 focus:ring-white/40 ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export default Input;

