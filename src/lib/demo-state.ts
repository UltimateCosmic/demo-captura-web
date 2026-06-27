import type { DemoSnapshot } from "@/lib/types"

export const emptyDemoSnapshot: DemoSnapshot = {
  files: [],
  events: [],
  currentUrl: "",
  currentHtml: "",
}

export function normalizeSnapshot(value: Partial<DemoSnapshot> = {}): DemoSnapshot {
  return {
    files: Array.isArray(value.files) ? value.files : [],
    events: Array.isArray(value.events) ? value.events : [],
    currentUrl: typeof value.currentUrl === "string" ? value.currentUrl : "",
    currentHtml: typeof value.currentHtml === "string" ? value.currentHtml : "",
  }
}
