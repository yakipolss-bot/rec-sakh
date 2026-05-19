import { renderPage } from 'vike/server'

export default async (req: any, res: any) => {
  try {
    const pageContextInit = { urlOriginal: req.url }
    const pageContext = await renderPage(pageContextInit)
    const { httpResponse } = pageContext
    if (!httpResponse) {
      res.statusCode = 200
      res.end()
      return
    }
    const { body, statusCode, headers } = httpResponse
    res.statusCode = statusCode
    headers.forEach(([name, value]: [string, string]) => res.setHeader(name, value))
    res.end(body)
  } catch (err: any) {
    console.error('SSR render error:', err?.stack || err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(`SSR Error: ${err?.message || String(err)}\n\n${err?.stack || ''}`)
  }
}
