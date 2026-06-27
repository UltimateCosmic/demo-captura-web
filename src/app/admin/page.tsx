"use client"

import { ChangeEvent, FormEvent, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileUp, Play } from "lucide-react"

import { EventLogPanel } from "@/components/event-log-panel"
import { PagePreview } from "@/components/page-preview"
import { UploadedFilesPanel } from "@/components/uploaded-files-panel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useCaptureStore, useCaptureStoreSync } from "@/lib/store"

function normalizeUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ""
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export default function AdminPage() {
  useCaptureStoreSync()

  const currentUrl = useCaptureStore((state) => state.currentUrl)
  const setCurrentUrl = useCaptureStore((state) => state.setCurrentUrl)
  const setCurrentHtml = useCaptureStore((state) => state.setCurrentHtml)
  const htmlInputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const visibleUrl = url ?? currentUrl

  const loadPreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextUrl = normalizeUrl(visibleUrl)
    setCurrentUrl(nextUrl)
  }

  const loadHtmlFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const html = await file.text()
    const label = `HTML local: ${file.name}`

    setUrl(label)
    setCurrentHtml(html, label)
    event.target.value = ""
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 sm:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex items-center gap-3">
          <Button asChild size="icon-sm" variant="ghost">
            <Link href="/">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Cargar preview</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={loadPreview}>
              <Input
                value={visibleUrl}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://ejemplo.com"
                className="h-9"
              />
              <div className="flex gap-2">
                <Button type="submit">
                  <Play />
                  Cargar preview
                </Button>
                <input
                  ref={htmlInputRef}
                  type="file"
                  accept=".html,.htm,text/html"
                  className="hidden"
                  onChange={loadHtmlFile}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => htmlInputRef.current?.click()}
                >
                  <FileUp />
                  Subir HTML
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <PagePreview />
          <aside className="flex min-h-0 flex-col gap-6">
            <UploadedFilesPanel />
            <Separator />
            <EventLogPanel />
          </aside>
        </div>
      </div>
    </main>
  )
}
