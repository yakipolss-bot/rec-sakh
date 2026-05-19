import { usePageContext } from 'vike-react/usePageContext'

export { Page }

function Page() {
  const pageContext = usePageContext()
  const is404 = pageContext.is404 === true
  const error = (pageContext as any).errorWhileRendering

  if (is404) {
    return (
      <div className="pt-24 pb-8 max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <h1 className="sakh-heading mb-4">404 — Страница не найдена</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <a href="/" className="sakh-link">На главную</a>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-8 max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
      <h1 className="sakh-heading mb-4">500 — Ошибка сервера</h1>
      <p className="text-[var(--text-secondary)] mb-6">
        Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте обновить страницу позже.
      </p>
      {error && !import.meta.env.PROD && (
        <pre className="mt-4 p-4 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-sunset)', border: '1px solid var(--border-color)' }}>
          {(error as Error).message}
          {(error as Error).stack ? `\n\n${(error as Error).stack}` : ''}
        </pre>
      )}
      <a href="/" className="sakh-link">На главную</a>
    </div>
  )
}
