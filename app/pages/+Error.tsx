import { usePageContext } from 'vike-react/usePageContext';

export default function Page() {
  const ctx = usePageContext();
  const err = ctx.abortReason || ctx.errorWhileRender;

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>SSR Error</h1>
      <pre style={{ background: '#fdd', padding: '1rem', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
        {err?.message || String(err) || 'Unknown error'}
      </pre>
      <pre style={{ background: '#eee', padding: '1rem', borderRadius: 4, whiteSpace: 'pre-wrap', fontSize: 12 }}>
        {err?.stack || 'No stack trace'}
      </pre>
    </div>
  );
}
