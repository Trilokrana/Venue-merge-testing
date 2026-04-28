import { cn } from "@/lib/utils"
import React from "react"

type Props = {
  children: React.ReactNode
  className?: string
  variant?: "default" | "secondary"
}

const IconWrapper = ({ children, className, variant = "default" }: Props) => {
  const variantClasses = {
    default: "",
    secondary: "bg-secondary border-none",
  }
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border border-muted-foreground/50",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  )
}

export default IconWrapper
