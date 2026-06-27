"use client"

import type { DragEvent, KeyboardEvent, MouseEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Globe2, Loader2, UploadCloud } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useCaptureStore, useCaptureStoreSync } from "@/lib/store"
import { cn } from "@/lib/utils"

type MicrofrontDropSurfaceProps = {
  className?: string
  mode?: "admin" | "usuario"
}

function getUrlParts(url: string) {
  if (!url) {
    return { host: "Sin página seleccionada" }
  }

  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname.replace(/^www\./, ""),
    }
  } catch {
    return { host: url }
  }
}

export function MicrofrontDropSurface({
  className,
  mode = "admin",
}: MicrofrontDropSurfaceProps) {
  useCaptureStoreSync()

  const currentUrl = useCaptureStore((state) => state.currentUrl)
  const addFiles = useCaptureStore((state) => state.addFiles)
  const addEvent = useCaptureStore((state) => state.addEvent)
  const dragInsideRef = useRef(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeCleanupRef = useRef<(() => void) | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewError, setPreviewError] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const { host } = getUrlParts(currentUrl)
  const isUserMode = mode === "usuario"

  const recordDropFiles = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        addFiles(files)
      }

      addEvent({
        type: "drop",
        description: `${isUserMode ? "Usuario" : "Admin"} envió ${files.length} archivo(s) desde el microfront`,
      })
    },
    [addEvent, addFiles, isUserMode]
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
      addEvent({
        type: "click",
        description: isUserMode
          ? "Click dentro del microfront de usuario"
          : "Click dentro del preview",
      })
    }

    const handleFrameDoubleClick = () => {
      addEvent({
        type: "double-click",
        description: "Doble click dentro del microfront",
      })
    }

    const handleFrameKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement &&
        event.target.type === "password"
      ) {
        return
      }

      addEvent({
        type: "keydown",
        description: `Tecla presionada: ${event.key}`,
      })
    }

    const handleFrameDragEnter = (event: globalThis.DragEvent) => {
      if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) {
        return
      }

      event.preventDefault()
      if (dragInsideRef.current) {
        return
      }

      dragInsideRef.current = true
      setIsDragging(true)
      addEvent({
        type: "drag-enter",
        description: "Archivo entrando al microfront",
      })
    }

    const handleFrameDragOver = (event: globalThis.DragEvent) => {
      if (Array.from(event.dataTransfer?.types ?? []).includes("Files")) {
        event.preventDefault()
      }
    }

    const handleFrameDrop = (event: globalThis.DragEvent) => {
      event.preventDefault()
      dragInsideRef.current = false
      setIsDragging(false)
      recordDropFiles(Array.from(event.dataTransfer?.files ?? []))
    }

    frameDocument.addEventListener("click", handleFrameClick)
    frameDocument.addEventListener("dblclick", handleFrameDoubleClick)
    frameDocument.addEventListener("keydown", handleFrameKeyDown)
    frameDocument.addEventListener("dragenter", handleFrameDragEnter)
    frameDocument.addEventListener("dragover", handleFrameDragOver)
    frameDocument.addEventListener("drop", handleFrameDrop)

    iframeCleanupRef.current = () => {
      frameDocument.removeEventListener("click", handleFrameClick)
      frameDocument.removeEventListener("dblclick", handleFrameDoubleClick)
      frameDocument.removeEventListener("keydown", handleFrameKeyDown)
      frameDocument.removeEventListener("dragenter", handleFrameDragEnter)
      frameDocument.removeEventListener("dragover", handleFrameDragOver)
      frameDocument.removeEventListener("drop", handleFrameDrop)
    }
  }, [addEvent, isUserMode, recordDropFiles])

  useEffect(() => {
    if (!currentUrl) {
      return
    }

    const controller = new AbortController()

    fetch(`/api/preview-html?url=${encodeURIComponent(currentUrl)}`, {
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<{ html: string; error: string }>)
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
  }, [currentUrl])

  useEffect(() => {
    return () => iframeCleanupRef.current?.()
  }, [])

  useEffect(() => {
    const hasFiles = (event: globalThis.DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files")

    const handleWindowDragEnter = (event: globalThis.DragEvent) => {
      if (!hasFiles(event)) {
        return
      }

      event.preventDefault()
      if (dragInsideRef.current) {
        return
      }

      dragInsideRef.current = true
      setIsDragging(true)
      addEvent({
        type: "drag-enter",
        description: "Archivo entrando al microfront",
      })
    }

    const handleWindowDragOver = (event: globalThis.DragEvent) => {
      if (hasFiles(event)) {
        event.preventDefault()
      }
    }

    window.addEventListener("dragenter", handleWindowDragEnter)
    window.addEventListener("dragover", handleWindowDragOver)
    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter)
      window.removeEventListener("dragover", handleWindowDragOver)
    }
  }, [addEvent])

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.focus()
    addEvent({
      type: "click",
      description: isUserMode
        ? "Click dentro del microfront de usuario"
        : "Click dentro del preview",
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    addEvent({
      type: "keydown",
      description: `Tecla presionada: ${event.key}`,
    })
  }

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (dragInsideRef.current) {
      return
    }

    dragInsideRef.current = true
    setIsDragging(true)
    addEvent({
      type: "drag-enter",
      description: "Archivo entrando al microfront",
    })
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const currentTarget = event.currentTarget
    if (
      event.relatedTarget instanceof Node &&
      currentTarget.contains(event.relatedTarget)
    ) {
      return
    }

    dragInsideRef.current = false
    setIsDragging(false)
    addEvent({
      type: "drag-leave",
      description: "Archivo salió del microfront",
    })
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragInsideRef.current = false
    setIsDragging(false)
    recordDropFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label="Microfront con zona drag and drop"
      className={cn(
        "relative isolate min-h-[520px] overflow-hidden rounded-lg border bg-background outline-none",
        "transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50",
        isUserMode && "min-h-screen rounded-none border-0",
        className
      )}
      onClick={handleClick}
      onDoubleClick={() =>
        addEvent({
          type: "double-click",
          description: "Doble click dentro del microfront",
        })
      }
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 bg-muted" />

      {currentUrl && previewUrl === currentUrl && previewHtml ? (
        <iframe
          ref={iframeRef}
          title="Vista estática de la página"
          srcDoc={previewHtml}
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
          <Badge variant="outline">{host}</Badge>
        </div>
      )}

      {isDragging && (
        <div
          className="absolute inset-3 z-10 grid place-items-center rounded-lg border-2 border-dashed border-primary bg-background/85 backdrop-blur-sm"
          onDragLeave={handleDragLeave}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-card">
              <UploadCloud className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Suelta aquí</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
