"use client"

import { useEffect } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { emptyDemoSnapshot, normalizeSnapshot } from "@/lib/demo-state"
import type { DemoSnapshot, InteractionEvent } from "@/lib/types"

type CaptureStore = DemoSnapshot & {
  setCurrentUrl: (url: string) => void
  setCurrentHtml: (html: string, label: string) => void
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
  addEvent: (event: Omit<InteractionEvent, "id" | "timestamp">) => void
  clearEvents: () => void
  replaceSnapshot: (snapshot: DemoSnapshot) => void
}

const storageName = "demo-captura-web"
let saveTimer: ReturnType<typeof setTimeout> | null = null
let lastRemotePayload = ""

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getSnapshot(): DemoSnapshot {
  const state = useCaptureStore.getState()

  return {
    files: state.files,
    events: state.events,
    currentUrl: state.currentUrl,
    currentHtml: state.currentHtml,
  }
}

async function saveRemoteNow() {
  const snapshot = getSnapshot()
  const payload = JSON.stringify(snapshot)

  if (payload === lastRemotePayload) {
    return
  }

  lastRemotePayload = payload

  try {
    await fetch("/api/demo-state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
    })
  } catch {
    lastRemotePayload = ""
  }
}

function scheduleRemoteSave() {
  if (typeof window === "undefined") {
    return
  }

  if (saveTimer) {
    clearTimeout(saveTimer)
  }

  saveTimer = setTimeout(() => {
    void saveRemoteNow()
  }, 250)
}

async function loadRemoteSnapshot() {
  try {
    const response = await fetch("/api/demo-state", { cache: "no-store" })

    if (!response.ok) {
      return
    }

    const snapshot = normalizeSnapshot(await response.json())
    const payload = JSON.stringify(snapshot)

    if (payload && payload !== JSON.stringify(getSnapshot())) {
      lastRemotePayload = payload
      useCaptureStore.getState().replaceSnapshot(snapshot)
    }
  } catch {
    // Local-only mode remains usable when the remote sync endpoint is unavailable.
  }
}

export const useCaptureStore = create<CaptureStore>()(
  persist(
    (set) => ({
      ...emptyDemoSnapshot,
      setCurrentUrl: (url) => {
        set({ currentUrl: url, currentHtml: "" })
        scheduleRemoteSave()
      },
      setCurrentHtml: (html, label) => {
        set({ currentHtml: html, currentUrl: label })
        scheduleRemoteSave()
      },
      addFiles: (files) => {
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
        }))
        scheduleRemoteSave()
      },
      removeFile: (id) => {
        set((state) => ({
          files: state.files.filter((file) => file.id !== id),
        }))
        scheduleRemoteSave()
      },
      addEvent: (event) => {
        if (event.type !== "keydown") {
          return
        }

        set((state) => ({
          events: [
            {
              ...event,
              id: createId(),
              timestamp: new Date().toISOString(),
            },
            ...state.events,
          ].slice(0, 240),
        }))
        scheduleRemoteSave()
      },
      clearEvents: () => {
        set({ events: [] })
        scheduleRemoteSave()
      },
      replaceSnapshot: (snapshot) => {
        set(normalizeSnapshot(snapshot))
      },
    }),
    {
      name: storageName,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => getPersistedSnapshot(state),
    }
  )
)

function getPersistedSnapshot(state: CaptureStore): DemoSnapshot {
  return {
    files: state.files,
    events: state.events,
    currentUrl: state.currentUrl,
    currentHtml: state.currentHtml,
  }
}

export function useCaptureStoreSync() {
  useEffect(() => {
    void Promise.resolve(useCaptureStore.persist.rehydrate()).then(() => {
      void loadRemoteSnapshot()
    })

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageName) {
        void useCaptureStore.persist.rehydrate()
      }
    }

    const interval = window.setInterval(() => {
      void loadRemoteSnapshot()
    }, 2000)

    window.addEventListener("storage", handleStorage)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])
}
