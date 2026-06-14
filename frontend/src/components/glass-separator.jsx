"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "src/lib/utils"

const GlassSeparator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-gradient-to-r from-transparent via-white/20 to-transparent",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props} />
  )
)
GlassSeparator.displayName = SeparatorPrimitive.Root.displayName

export { GlassSeparator }
