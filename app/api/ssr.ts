import { renderPage } from 'vike/server'

function getErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error'
  if (err instanceof Error) return `${err.message}\n${err.stack || ''}`
  return String(err)
}

export default async (req: any, res: any) => {
  try {
    const pageContextInit = { urlOriginal: req.url }
    const pageContext = await renderPage(pageContextInit)

    // Check for Vike's internal rendering errors
    const renderErr = (pageContext as any).errorWhileRendering || pageContext.abortReason
    if (renderErr) {
      const msg = `[Vike Error] ${getErrorMessage(renderErr)}`
      console.error(msg)
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(msg)
      return
    }

    const { httpResponse } = pageContext
    if (!httpResponse) {
      res.statusCode = 200
      res.end()
      return
    }

    const { statusCode, headers } = httpResponse

    // If Vike returned 500 (e.g. error during global init or missing error page),
    // try to extract the actual error from pageContext
    if (statusCode >= 500) {
      const ctxErr = (pageContext as any).errorWhileRendering
      if (ctxErr) {
        const msg = `[SSR 500] ${getErrorMessage(ctxErr)}`
        console.error(msg)
        res.statusCode = 500
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(msg)
        return
      }
    }

    const body = httpResponse.body
    res.statusCode = statusCode
    headers.forEach(([name, value]: [string, string]) => res.setHeader(name, value))
    res.end(body)
  } catch (err: any) {
    console.error('SSR render error:', err?.stack || err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(`[SSR Fatal] ${getErrorMessage(err)}`)
  }
}
