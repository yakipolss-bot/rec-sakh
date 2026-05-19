import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PageContextProvider } from 'vike-react/PageContextProvider';
import { BrowserRouter } from 'react-router-dom';

export { onRenderClient };

async function onRenderClient(pageContext: any) {
  const { Page, pageProps } = pageContext;

  hydrateRoot(
    document.getElementById('root')!,
    <PageContextProvider pageContext={pageContext}>
      <BrowserRouter>
        <Page {...pageProps} />
      </BrowserRouter>
    </PageContextProvider>,
  );
}
