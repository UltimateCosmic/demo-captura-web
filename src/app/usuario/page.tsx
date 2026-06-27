"use client"

import { MicrofrontDropSurface } from "@/components/microfront-drop-surface"
import { useCaptureStoreSync } from "@/lib/store"

export default function UsuarioPage() {
  useCaptureStoreSync()

  return (
    <main className="min-h-screen bg-background">
      <MicrofrontDropSurface mode="usuario" className="min-h-screen" />
    </main>
  )
}
