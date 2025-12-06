import { Logo } from "@/components/common/logo"

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="text-sm text-muted-foreground">
              강원특별자치도 보조기기센터
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>© 2025 GWATC. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

