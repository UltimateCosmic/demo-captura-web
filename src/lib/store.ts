"use client"

import { useEffect } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { InteractionEvent, UploadedFile } from "@/lib/types"

type CaptureStore = {
  files: UploadedFile[]
  events: InteractionEvent[]
  currentUrl: string
  setCurrentUrl: (url: string) => void
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
  addEvent: (event: Omit<InteractionEvent, "id" | "timestamp">) => void
  clearEvents: () => void
}

const storageName = "demo-captura-web"

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useCaptureStore = create<CaptureStore>()(
  persist(
    (set) => ({
      files: [],
      events: [],
      currentUrl: "",
      setCurrentUrl: (url) => set({ currentUrl: url }),
      addFiles: (files) =>
        set((state) => ({
          files: [
            ...files.map((file) => ({
              id: createId(),
              name: file.name,
              size: file.size,
              type: file.type || "desconocido",
              uploadedAt: new Date().toISOString(),
            })),
            ...state.files,
          ],
        })),
      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((file) => file.id !== id),
        })),
      addEvent: (event) =>
        set((state) => ({
          events: [
            {
              ...event,
              id: createId(),
              timestamp: new Date().toISOString(),
            },
            ...state.events,
          ].slice(0, 120),
        })),
      clearEvents: () => set({ events: [] }),
    }),
    {
      name: storageName,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        files: state.files,
        events: state.events,
        currentUrl: state.currentUrl,
      }),
    }
  )
)

export function useCaptureStoreSync() {
  useEffect(() => {
    void useCaptureStore.persist.rehydrate()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageName) {
        void useCaptureStore.persist.rehydrate()
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])
}
