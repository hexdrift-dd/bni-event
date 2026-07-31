import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    className={cn(
      "flex h-11 w-full rounded-lg border border-[#D4C4A8] bg-[#FFFbf5] px-3 py-2 text-sm text-[#2F1B14] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
