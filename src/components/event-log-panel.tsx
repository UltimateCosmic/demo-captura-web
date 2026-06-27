"use client"

import { Keyboard, ListRestart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCaptureStore, useCaptureStoreSync } from "@/lib/store"

export function EventLogPanel() {
  useCaptureStoreSync()

  const events = useCaptureStore((state) => state.events)
  const clearEvents = useCaptureStore((state) => state.clearEvents)
  const keyEvents = events
    .filter((event) => event.type === "keydown")
    .slice()
    .reverse()

  return (
    <Card className="min-h-0">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <CardTitle>Inputs de teclado</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{keyEvents.length}</Badge>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Limpiar eventos"
              onClick={clearEvents}
              disabled={keyEvents.length === 0}
            >
              <ListRestart />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {keyEvents.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-center">
            <Keyboard className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Presiona teclas dentro del preview para verlas aquí.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-32 rounded-lg border bg-background p-3">
            <p className="break-words font-mono text-sm leading-7 text-muted-foreground">
              {keyEvents.map((event) => event.description).join("  ")}
            </p>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
