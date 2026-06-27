export const dynamic = "force-dynamic"

function cleanHtml(html: string, sourceUrl: string) {
  const baseTag = `<base href="${sourceUrl}">`
  const withoutScripts = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s(on\w+)=(["']).*?\2/gi, "")

  if (/<head[^>]*>/i.test(withoutScripts)) {
    return withoutScripts.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`)
  }

  return `${baseTag}${withoutScripts}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get("url")

  if (!rawUrl) {
    return Response.json({ html: "", error: "URL requerida" }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(rawUrl)
  } catch {
    return Response.json({ html: "", error: "URL inválida" }, { status: 400 })
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return Response.json(
      { html: "", error: "Solo se permiten URLs http o https" },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(target.href, {
      cache: "no-store",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 demo-captura-web",
      },
      signal: AbortSignal.timeout(8000),
    })

    const contentType = response.headers.get("content-type") ?? ""
    if (!response.ok || !contentType.includes("text/html")) {
      return Response.json(
        { html: "", error: "No se pudo obtener HTML de esa página" },
        { status: 502 }
      )
    }

    const html = await response.text()

    return Response.json({
      html: cleanHtml(html, target.href),
      error: "",
    })
  } catch {
    return Response.json(
      { html: "", error: "No se pudo cargar la vista estática" },
      { status: 502 }
    )
  }
}
