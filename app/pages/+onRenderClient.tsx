import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PageContextProvider } from 'vike-react/usePageContext';
import type { PageContextClient } from 'vike/types';
import { BrowserRouter } from 'react-router-dom';
import Layout from './+Layout';

export { onRenderClient };

async function onRenderClient(pageContext: PageContextClient) {
  const { Page, pageProps } = pageContext;

  hydrateRoot(
    document.getElementById('root')!,
    <PageContextProvider pageContext={pageContext}>
      <BrowserRouter>
        <Layout>
          <Page {...pageProps} />
        </Layout>
      </BrowserRouter>
    </PageContextProvider>,
  );
}
