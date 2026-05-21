import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import ReactDOMServer from 'react-dom/server';
import { PageContextProvider } from 'vike-react/usePageContext';
import type { PageContextServer } from 'vike/types';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Layout from './+Layout';

export { onRenderHtml };

interface SeoData {
  title?: string;
  description?: string;
  image?: string;
  article?: {
    title: string;
    description: string;
    image: string;
    publishedAt: string;
    updatedAt: string;
    author: string;
    category: string;
    slug: string;
  };
}

async function onRenderHtml(pageContext: PageContextServer) {
  const { Page, pageProps } = pageContext;
  const seo: SeoData | undefined = pageContext.seo;

  const url = pageContext.urlParsed
    ? (pageContext.urlParsed.pathname ?? '/') + (pageContext.urlParsed.searchString ?? '')
    : '/'
  let pageHtml: string;
  try {
    pageHtml = ReactDOMServer.renderToString(
      <PageContextProvider pageContext={pageContext}>
        <MemoryRouter initialEntries={[url]}>
          <Layout>
            <Page {...pageProps} />
          </Layout>
        </MemoryRouter>
      </PageContextProvider>,
    );
  } catch (err) {
    const msg = `[SSR Error] ${(err as Error).message}\n${(err as Error).stack || ''}`;
    console.error(msg);
    pageHtml = `<pre style="background:#1a1a2e;color:#ff6b6b;padding:2rem;font-family:monospace;font-size:14px;white-space:pre-wrap;margin:0;min-height:100vh">${msg}</pre>`;
  }

  const defaultTitle = 'Sakhcom — Новости Сахалина';
  const defaultDescription = 'Новости Сахалина и Курильских островов. Актуальные события, происшествия, экономика, спорт, культура.';
  const defaultImage = '/og-default.jpg';
  const siteUrl = 'https://rec-sakh.vercel.app';

  const pageTitle = seo?.title
    ? `${seo.title} — Sakhcom`
    : defaultTitle;

  const pageDescription = seo?.description || defaultDescription;
  const pageImage = seo?.image
    ? (seo.image.startsWith('http') ? seo.image : `${siteUrl}${seo.image}`)
    : `${siteUrl}${defaultImage}`;

  const jsonLd: Record<string, unknown>[] = [];

  jsonLd.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sakhcom',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 'Новостной портал Сахалина и Курильских островов',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'admin@rec-sakh.ru',
      url: siteUrl,
    },
  });

  jsonLd.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    name: 'Breadcrumb',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: siteUrl },
      ...(seo?.article
        ? [
            {
              '@type': 'ListItem' as const,
              position: 2,
              name: seo.article.category,
              item: `${siteUrl}/category/${seo.article.category.toLowerCase()}`,
            },
            {
              '@type': 'ListItem' as const,
              position: 3,
              name: seo.article.title,
              item: `${siteUrl}/news/${seo.article.slug}`,
            },
          ]
        : []),
    ],
  });

  if (seo?.article) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: seo.article.title,
      description: seo.article.description,
      image: seo.article.image.startsWith('http')
        ? seo.article.image
        : `${siteUrl}${seo.article.image}`,
      datePublished: seo.article.publishedAt,
      dateModified: seo.article.updatedAt,
      author: {
        '@type': 'Person',
        name: seo.article.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Sakhcom',
        logo: `${siteUrl}/logo.png`,
      },
      articleSection: seo.article.category,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${siteUrl}/news/${seo.article.slug}`,
      },
    });
  }

  const jsonLdHtml = jsonLd.map((schema) =>
    JSON.stringify(schema, null, 0),
  );

  return escapeInject`<!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${pageTitle}</title>
        <meta name="description" content="${pageDescription}" />

        <meta property="og:type" content="${seo?.article ? 'article' : 'website'}" />
        <meta property="og:title" content="${pageTitle}" />
        <meta property="og:description" content="${pageDescription}" />
        <meta property="og:image" content="${pageImage}" />
        <meta property="og:url" content="${siteUrl}" />
        <meta property="og:site_name" content="Sakhcom" />
        <meta property="og:locale" content="ru_RU" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${pageTitle}" />
        <meta name="twitter:description" content="${pageDescription}" />
        <meta name="twitter:image" content="${pageImage}" />

        ${seo?.article ? `<meta property="article:published_time" content="${seo.article.publishedAt}" />` : ''}
        ${seo?.article ? `<meta property="article:modified_time" content="${seo.article.updatedAt}" />` : ''}
        ${seo?.article ? `<meta property="article:section" content="${seo.article.category}" />` : ''}

        ${dangerouslySkipEscape(jsonLdHtml.map((ld) => `<script type="application/ld+json">${ld}</script>`).join('\n        '))}
      </head>
      <body>
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`;
}
