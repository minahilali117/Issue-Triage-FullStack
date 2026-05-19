"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "bg-transparent hover:bg-accent/50",
        outline: "bg-transparent border hover:bg-accent/50",
      },
      size: {
        sm: "h-8 px-3",
        default: "h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "ghost" | "outline"
    size?: "sm" | "default"
    asChild?: boolean
  }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp: any = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
