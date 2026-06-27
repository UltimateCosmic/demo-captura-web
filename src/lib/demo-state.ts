import type { DemoSnapshot } from "@/lib/types"

export const emptyDemoSnapshot: DemoSnapshot = {
  files: [],
  events: [],
  typedText: "",
  currentUrl: "",
  currentHtml: "",
}

function applyKey(text: string, key: string) {
  if (key === "\\b" || key === "Backspace") {
    return text.slice(0, -1)
  }

  if (key === "Enter") {
    return `${text}\n`
  }

  if (key === "Tab") {
    return `${text}\t`
  }

  if (key === " ") {
    return `${text} `
  }

  if (key.length === 1) {
    return `${text}${key}`
  }

  return text
}

function keyFromDescription(description: string) {
  if (description.startsWith("input: ")) {
    return description.slice(7)
  }

  return description.replace(/^keydown:\s*/, "")
}

function reconstructTypedText(value: Partial<DemoSnapshot>) {
  if (typeof value.typedText === "string") {
    return value.typedText
  }

  if (!Array.isArray(value.events)) {
    return ""
  }

  return value.events
    .filter((event) => event.type === "keydown")
    .slice()
    .reverse()
    .reduce(
      (text, event) => applyKey(text, keyFromDescription(event.description)),
      ""
    )
}

export function normalizeSnapshot(value: Partial<DemoSnapshot> = {}): DemoSnapshot {
  return {
    files: Array.isArray(value.files) ? value.files : [],
    events: Array.isArray(value.events) ? value.events : [],
    typedText: reconstructTypedText(value),
    currentUrl: typeof value.currentUrl === "string" ? value.currentUrl : "",
    currentHtml: typeof value.currentHtml === "string" ? value.currentHtml : "",
  }
}
