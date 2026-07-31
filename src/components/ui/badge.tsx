import * as React from "react";
import { cn } from "@/lib/utils";

export const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "success" | "warning" | "danger" | "muted";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#CF2030] text-[#F8F1E7]",
    success: "bg-emerald-100 text-emerald-900 border-emerald-200",
    warning: "bg-amber-100 text-amber-900 border-amber-200",
    danger: "bg-red-100 text-red-900 border-red-200",
    muted: "bg-[#F3E8D8] text-[#6B5344] border-[#E2D3B8]",
  };
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";
