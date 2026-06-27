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

async function readFromSupabase() {
  const endpoint = getSupabaseEndpoint()

  if (!endpoint || !supabaseKey) {
    return null
  }

  const response = await fetch(
    `${endpoint}?id=eq.${encodeURIComponent(stateId)}&select=data`,
    {
      headers: {
        apikey: supabaseKey,
        authorization: `Bearer ${supabaseKey}`,
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
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

  const response = await fetch(endpoint, {
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
  })

  return response.ok
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
