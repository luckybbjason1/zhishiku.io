import * as React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-neutral-800 text-neutral-300",
    success: "bg-emerald-900/50 text-emerald-400",
    warning: "bg-yellow-900/50 text-yellow-400",
    error: "bg-red-900/50 text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
