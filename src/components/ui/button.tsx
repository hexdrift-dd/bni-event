import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#CF2030] text-white shadow-md hover:bg-[#A81926] focus-visible:ring-[#CF2030]",
        secondary:
          "bg-[#A81926] text-[#F8F1E7] hover:bg-[#7A121C] focus-visible:ring-[#CF2030]",
        outline:
          "border border-[#C9A86A]/60 bg-transparent text-[#CF2030] hover:bg-[#F3E8D8]",
        ghost: "text-[#CF2030] hover:bg-[#F3E8D8]",
        danger:
          "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700",
        success:
          "bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-700",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { buttonVariants };
