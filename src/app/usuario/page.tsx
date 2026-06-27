"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Globe2 } from "lucide-react"

import { MicrofrontDropSurface } from "@/components/microfront-drop-surface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCaptureStore, useCaptureStoreSync } from "@/lib/store"

export default function UsuarioPage() {
  useCaptureStoreSync()

  const router = useRouter()
  const currentUrl = useCaptureStore((state) => state.currentUrl)

  return (
    <main className="min-h-screen bg-background">
      <header className="flex h-12 items-center gap-3 border-b bg-background px-3">
        <Button
          aria-label="Retroceder"
          size="icon-sm"
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft />
        </Button>
        <Badge
          variant="outline"
          className="min-w-0 max-w-full gap-2 rounded-lg px-3 py-1"
        >
          <Globe2 className="size-3.5 shrink-0" />
          <span className="truncate font-mono">
            {currentUrl || "Sin página seleccionada"}
          </span>
        </Badge>
      </header>
      <MicrofrontDropSurface
        mode="usuario"
        className="min-h-[calc(100vh-3rem)]"
      />
    </main>
  )
}
