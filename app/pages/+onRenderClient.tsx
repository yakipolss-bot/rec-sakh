import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PageContextProvider } from 'vike-react/usePageContext';
import { BrowserRouter } from 'react-router-dom';
import Layout from './+Layout';

export { onRenderClient };

async function onRenderClient(pageContext: any) {
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
