"use client"

import { UploadCloud } from "lucide-react"
import { useDropzone } from "react-dropzone"

import { Badge } from "@/components/ui/badge"
import { useCaptureStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function FileDropzone() {
  const addFiles = useCaptureStore((state) => state.addFiles)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        return
      }

      addFiles(acceptedFiles)
    },
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "rounded-lg border border-dashed bg-muted/25 p-8 text-center transition-colors",
        "cursor-pointer outline-none",
        "hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/40",
        isDragActive && "border-primary bg-primary/5"
      )}
    >
      <input {...getInputProps()} />
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg border bg-background">
          <UploadCloud className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">
            {isDragActive ? "Suelta los archivos aquí" : "Arrastra archivos aquí"}
          </p>
          <p className="text-sm text-muted-foreground">
            También puedes hacer clic para seleccionarlos desde tu equipo.
          </p>
        </div>
        <Badge variant="outline">Solo metadata local</Badge>
      </div>
    </div>
  )
}
