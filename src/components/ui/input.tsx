import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border-0 border-b-2 border-b-transparent bg-surface-container-highest px-3 py-2 text-sm text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50 focus-visible:border-b-primary-container focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-on-surface",
        className
      )}
      {...props}
    />
  )
}

export { Input }
