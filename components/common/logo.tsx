export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded bg-primary text-primary-foreground">
        <span className="text-xs sm:text-sm font-bold">GW</span>
      </div>
      <span className="text-base sm:text-lg font-semibold text-foreground">GWATC</span>
    </div>
  )
}

