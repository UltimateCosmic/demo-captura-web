"use client"

import { FileText, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatBytes, formatDate } from "@/lib/format"
import { useCaptureStore } from "@/lib/store"

type UploadedFilesPanelProps = {
  readonly?: boolean
}

export function UploadedFilesPanel({ readonly = false }: UploadedFilesPanelProps) {
  const files = useCaptureStore((state) => state.files)
  const removeFile = useCaptureStore((state) => state.removeFile)

  return (
    <Card className="min-h-0">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
            <CardTitle>Archivos recibidos</CardTitle>
          <Badge variant="secondary">{files.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-center">
            <FileText className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Todavía no hay archivos en esta demo.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64 pr-3">
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatBytes(file.size)}</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                    <Badge variant="outline" className="max-w-full truncate">
                      {file.type}
                    </Badge>
                  </div>
                  {!readonly && (
                    <Button
                      aria-label={`Eliminar ${file.name}`}
                      size="icon-sm"
                      variant="destructive"
                      onClick={() => removeFile(file.id)}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
