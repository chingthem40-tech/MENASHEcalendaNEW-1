import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white/[0.06] skeleton-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
