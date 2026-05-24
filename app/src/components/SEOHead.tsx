import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Sakhcom — Новости Сахалина';
const DEFAULT_DESCRIPTION = 'Новости Южно-Сахалинска и Сахалинской области. Оперативные события, аналитика, происшествия, экономика, культура, спорт.';
const DEFAULT_IMAGE = '/og-image.jpg';
const BASE_URL = 'https://sakhcom.ru';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
  noIndex?: boolean;
}

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  publishedAt,
  updatedAt,
  authorName,
  noIndex,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const imgUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imgUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="ru_RU" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imgUrl} />

      <link rel="canonical" href={fullUrl} />

      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {updatedAt && <meta property="article:modified_time" content={updatedAt} />}
      {authorName && <meta property="article:author" content={authorName} />}

      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
