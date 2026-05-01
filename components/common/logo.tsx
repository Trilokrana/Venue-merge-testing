"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"

const Logo = ({
  width = 100,
  height = 100,
  className,
}: {
  width?: number
  height?: number
  className?: string
}) => {
  return (
    <Image
      src="/images/logo-1.png"
      alt="Logo"
      width={width}
      height={height}
      className={cn("w-10 h-10 rounded-md", className)}
    />
  )
}

export default Logo
