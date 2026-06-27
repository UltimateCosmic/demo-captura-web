"use client"

import { Activity, ListRestart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate } from "@/lib/format"
import { useCaptureStore, useCaptureStoreSync } from "@/lib/store"

export function EventLogPanel() {
  useCaptureStoreSync()

  const events = useCaptureStore((state) => state.events)
  const clearEvents = useCaptureStore((state) => state.clearEvents)

  return (
    <Card className="min-h-0">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Eventos de interacción</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{events.length}</Badge>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Limpiar eventos"
              onClick={clearEvents}
              disabled={events.length === 0}
            >
              <ListRestart />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-center">
            <Activity className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Interactúa con el preview para llenar este log.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-72 pr-3">
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Badge variant="outline">{event.type}</Badge>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
