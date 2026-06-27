export type UploadedFile = {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
}

export type InteractionEvent = {
  id: string
  type: "keydown"
  description: string
  timestamp: string
}

export type DemoSnapshot = {
  files: UploadedFile[]
  events: InteractionEvent[]
  currentUrl: string
  currentHtml: string
}
