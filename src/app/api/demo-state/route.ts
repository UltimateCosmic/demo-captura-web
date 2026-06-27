import { emptyDemoSnapshot, normalizeSnapshot } from "@/lib/demo-state"
import type { DemoSnapshot } from "@/lib/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

function responseHeaders(storage: "memory" | "supabase") {
  return {
    "cache-control": "no-store, max-age=0",
    "x-demo-storage": storage,
  }
}

const stateId = process.env.DEMO_STATE_ID || "default"
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const supabaseTimeoutMs = 3500

type MemoryStore = {
  snapshot: DemoSnapshot
}

const globalStore = globalThis as typeof globalThis & {
  __demoCapturaState?: MemoryStore
}

function getMemoryStore() {
  if (!globalStore.__demoCapturaState) {
    globalStore.__demoCapturaState = { snapshot: emptyDemoSnapshot }
  }

  return globalStore.__demoCapturaState
}

function getSupabaseEndpoint() {
  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/demo_state`
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  label: string
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), supabaseTimeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    console.error(`[demo-state] ${label} failed`, {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function readFromSupabase() {
  const endpoint = getSupabaseEndpoint()

  if (!endpoint || !supabaseKey) {
    return null
  }

  const response = await fetchWithTimeout(
    `${endpoint}?id=eq.${encodeURIComponent(stateId)}&select=data`,
    {
      headers: {
        apikey: supabaseKey,
        authorization: `Bearer ${supabaseKey}`,
      },
      cache: "no-store",
    },
    "read"
  )

  if (!response || !response.ok) {
    if (response) {
      console.error("[demo-state] read returned non-ok", {
        status: response.status,
      })
    }

    return null
  }

  const rows = (await response.json()) as Array<{ data?: Partial<DemoSnapshot> }>

  return rows[0]?.data ? normalizeSnapshot(rows[0].data) : emptyDemoSnapshot
}

async function writeToSupabase(snapshot: DemoSnapshot) {
  const endpoint = getSupabaseEndpoint()

  if (!endpoint || !supabaseKey) {
    return false
  }

  const response = await fetchWithTimeout(
    endpoint,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        authorization: `Bearer ${supabaseKey}`,
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: stateId,
        data: snapshot,
        updated_at: new Date().toISOString(),
      }),
    },
    "write"
  )

  if (!response?.ok) {
    if (response) {
      console.error("[demo-state] write returned non-ok", {
        status: response.status,
      })
    }

    return false
  }

  return true
}

export async function GET() {
  const remoteSnapshot = await readFromSupabase()

  if (remoteSnapshot) {
    return Response.json(remoteSnapshot, {
      headers: responseHeaders("supabase"),
    })
  }

  return Response.json(getMemoryStore().snapshot, {
    headers: responseHeaders("memory"),
  })
}

export async function POST(request: Request) {
  const snapshot = normalizeSnapshot(await request.json())
  const saved = await writeToSupabase(snapshot)

  if (!saved) {
    getMemoryStore().snapshot = snapshot
  }

  return Response.json(
    { ok: true, remote: saved },
    { headers: responseHeaders(saved ? "supabase" : "memory") }
  )
}
