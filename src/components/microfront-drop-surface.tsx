"use client"

import type { DragEvent, KeyboardEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Globe2, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useCaptureStore, useCaptureStoreSync } from "@/lib/store"
import { cn } from "@/lib/utils"

type MicrofrontDropSurfaceProps = {
  className?: string
  mode?: "admin" | "usuario"
}

function getEmptyLabel(url: string) {
  return url || "Sin página seleccionada"
}

function isFileDrag(event: DragEvent<HTMLElement> | globalThis.DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files")
}

export function MicrofrontDropSurface({
  className,
  mode = "admin",
}: MicrofrontDropSurfaceProps) {
  useCaptureStoreSync()

  const currentUrl = useCaptureStore((state) => state.currentUrl)
  const currentHtml = useCaptureStore((state) => state.currentHtml)
  const addFiles = useCaptureStore((state) => state.addFiles)
  const addEvent = useCaptureStore((state) => state.addEvent)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeCleanupRef = useRef<(() => void) | null>(null)
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewError, setPreviewError] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const isUserMode = mode === "usuario"
  const htmlToRender =
    currentHtml || (previewUrl === currentUrl ? previewHtml : "")

  const recordFiles = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        addFiles(files)
      }
    },
    [addFiles]
  )

  const recordKey = useCallback(
    (key: string) => {
      addEvent({
        type: "keydown",
        description: `keydown: ${key}`,
      })
    },
    [addEvent]
  )

  const attachIframeListeners = useCallback(() => {
    iframeCleanupRef.current?.()
    iframeCleanupRef.current = null

    const frameDocument = iframeRef.current?.contentDocument
    if (!frameDocument) {
      return
    }

    frameDocument.body.tabIndex = 0

    const handleFrameClick = () => {
      frameDocument.body.focus()
    }

    const handleFrameKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement &&
        event.target.type === "password"
      ) {
        return
      }

      recordKey(event.key)
    }

    const handleFrameDragOver = (event: globalThis.DragEvent) => {
      if (isFileDrag(event)) {
        event.preventDefault()
      }
    }

    const handleFrameDrop = (event: globalThis.DragEvent) => {
      event.preventDefault()
      recordFiles(Array.from(event.dataTransfer?.files ?? []))
    }

    frameDocument.addEventListener("click", handleFrameClick)
    frameDocument.addEventListener("keydown", handleFrameKeyDown)
    frameDocument.addEventListener("dragover", handleFrameDragOver)
    frameDocument.addEventListener("drop", handleFrameDrop)

    iframeCleanupRef.current = () => {
      frameDocument.removeEventListener("click", handleFrameClick)
      frameDocument.removeEventListener("keydown", handleFrameKeyDown)
      frameDocument.removeEventListener("dragover", handleFrameDragOver)
      frameDocument.removeEventListener("drop", handleFrameDrop)
    }
  }, [recordFiles, recordKey])

  useEffect(() => {
    if (!currentUrl || currentHtml) {
      return
    }

    const controller = new AbortController()

    fetch(`/api/preview-html?url=${encodeURIComponent(currentUrl)}`, {
      signal: controller.signal,
    })
      .then(
        (response) =>
          response.json() as Promise<{ html: string; error: string }>
      )
      .then((data) => {
        if (!controller.signal.aborted) {
          setPreviewUrl(currentUrl)
          setPreviewHtml(data.html)
          setPreviewError(data.error)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPreviewUrl(currentUrl)
          setPreviewHtml("")
          setPreviewError("No se pudo cargar la vista estática")
        }
      })

    return () => controller.abort()
  }, [currentHtml, currentUrl])

  useEffect(() => {
    return () => iframeCleanupRef.current?.()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    recordKey(event.key)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (isFileDrag(event)) {
      event.preventDefault()
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    recordFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <div
      tabIndex={0}
      aria-label="Microfront con zona drag and drop"
      className={cn(
        "relative isolate min-h-[520px] overflow-hidden rounded-lg border bg-background outline-none",
        "transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50",
        isUserMode && "min-h-full rounded-none border-0",
        className
      )}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 bg-muted" />

      {currentUrl && (currentHtml || previewUrl === currentUrl) && htmlToRender ? (
        <iframe
          ref={iframeRef}
          title="Vista estática de la página"
          srcDoc={htmlToRender}
          sandbox="allow-same-origin"
          onLoad={attachIframeListeners}
          className="absolute inset-0 size-full border-0 bg-white"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-background">
          <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
            {currentUrl && previewUrl !== currentUrl ? (
              <>
                <Loader2 className="size-6 animate-spin" />
                <span>Cargando vista estática...</span>
              </>
            ) : (
              <>
                <Globe2 className="size-6" />
                <span>{previewError || "Elige una página en Admin"}</span>
              </>
            )}
          </div>
        </div>
      )}

      {!currentUrl && (
        <div className="pointer-events-none absolute left-4 top-4 z-[1]">
          <Badge variant="outline">{getEmptyLabel(currentUrl)}</Badge>
        </div>
      )}
    </div>
  )
}
