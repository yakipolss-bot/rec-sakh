import React from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { PageContextProvider } from 'vike-react/usePageContext';
import type { PageContextClient } from 'vike/types';
import { BrowserRouter } from 'react-router-dom';
import Layout from './+Layout';

export { onRenderClient };

let root: Root | undefined;

async function onRenderClient(pageContext: PageContextClient) {
  const { Page, pageProps, isHydration } = pageContext;

  const page = (
    <PageContextProvider pageContext={pageContext}>
      <BrowserRouter>
        <Layout>
          <Page {...pageProps} />
        </Layout>
      </BrowserRouter>
    </PageContextProvider>
  );

  if (isHydration) {
    root = hydrateRoot(document.getElementById('root')!, page);
  } else {
    root!.render(page);
  }
}
