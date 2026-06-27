export type UploadedFile = {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
}

export type InteractionEvent = {
  id: string
  type:
    | "click"
    | "double-click"
    | "keydown"
    | "drag-enter"
    | "drag-leave"
    | "drop"
    | "info"
  description: string
  timestamp: string
}
