# System Architecture — Sakhcom Portal

---

## ADR-001: Frontend Framework Decision

### Status
Accepted

### Context
Текущий код — Vite + React 19 SPA. Документация рекомендует Next.js 15 (App Router) для SSR, SEO и улучшенной архитектуры. Новостной портал критически зависит от SEO-видимости в поисковиках и AI-агентах.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **A: Next.js 15** | SSR из коробки, SEO, App Router, server components, API routes, image optimization, opinionated structure | Полный rewrite фронта, крутая кривая обучения для команды, оверхед миграции |
| **B: Vite + React (текущий) + отдельный backend** | Сохраняет существующий код, быстрый старт, простота, гибкость | Нет SSR (плохо для SEO), ручная настройка code splitting, две инфраструктуры |
| **C: Vite + SSR-плагин (vite-plugin-ssr / vike)** | SSR без миграции фреймворка, сохраняет текущий код, incremental adoption | Меньше экосистемы, чем Next.js, меньше reference-проектов, ручная настройка |

### Decision
**Option C + постепенная миграция к Option A.**

Фаза 1 (сейчас): Vite + @vite-plugin-ssr (Vike) для SSR.
Фаза 2 (3-6 мес): Миграция на Next.js когда MVP подтвердит product-market fit.

Rationale:
- SEO критичен для новостного портала (Schema.org, Open Graph, AI-агенты)
- SSR необходим для visibility в ChatGPT Search, Perplexity, Google
- Vike даёт SSR на существующем Vite-стеке без rewrite
- Next.js откладывается до Фазы 2, когда требования стабильны

### Consequences
- Легче: SSR, SEO, сохранение текущего кода, incremental adoption
- Сложнее: ручная настройка Vike vs готовый Next.js, меньше reference-проектов
- Нейтрально: архитектура компонентов не меняется, только слой рендеринга

---

## ADR-002: Backend Framework Decision

### Status
Accepted

### Context
Документация рекомендует NestJS / Fastify (Node.js) или Go. Команда владеет TypeScript. Проекту нужен REST API, очереди, WebSocket, интеграция с внешними API.

### Decision
**NestJS + Fastify (hybrid).**

NestJS как основной фреймворк, Fastify как движок HTTP (через `@nestjs/platform-fastify`).

Rationale:
- Единый язык с фронтом (TypeScript) — снижает context switching
- NestJS модульная архитектура совпадает с bounded contexts проекта
- Fastify быстрее Express в 2x и имеет built-in schema validation
- Встроенная поддержка: Swagger, GraphQL, WebSockets, queues, cron, auth guards
- Prisma ORM как единый слой данных

### Consequences
- Легче: единый язык, модульная архитектура, богатая экосистема
- Сложнее: NestJS boilerplate, DI-контейнер может быть избыточным для простых эндпоинтов
- Риск: NestJS популярен, но не так widespread в production как Express/Fastify

---

## ADR-003: Database & Storage

### Status
Accepted

### Context
Проекту нужна реляционная БД, time-series для аналитики/погоды, полнотекстовый поиск, кэш.

### Decision
- **PostgreSQL 16** — основная БД
- **TimescaleDB** — extension для time-series (погода, аналитика, просмотры)
- **Redis 7** — кэш, сессии, очереди (BullMQ), автокомплит
- **Typesense** — полнотекстовый поиск (primary)
- **Elasticsearch** — аналитика поиска (secondary)
- **S3 (Selectel / Yandex Cloud)** — медиафайлы

### Consequences
- Легче: Postgres + TimescaleDB покрывает 90% потребностей без отдельной time-series БД
- Сложнее: Typesense + Elasticsearch — две поисковые системы, нужен sync
- Риск: Elasticsearch может быть избыточен на старте — можно начать с одного Typesense

---

## ADR-004: Authentication & Authorization

### Status
Accepted

### Context
5 ролей (гость, пользователь, журналист, редактор, модератор, админ), JWT + OAuth (Telegram, VK, Яндекс), SMS-верификация.

### Decision
**Lucia v3 + JWT + OAuth 2.0.**

Lucia как auth-библиотека (session management, OAuth providers). JWT access + refresh tokens.

RBAC на уровне NestJS guards + Casl (casl.js) для ability-based permissions.

### Consequences
- Легче: Lucia проще NextAuth, встроенная поддержка Drizzle/Prisma
- Сложнее: OAuth провайдеров нужно настраивать вручную (нет built-in как в NextAuth)
- Риск: Lucia относительно молодой проект

---

## Bounded Contexts & Module Map

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SAKHCOM SYSTEM                               │
├──────────────────────┬───────────────────┬───────────────────────────┤
│   PUBLIC FRONTEND    │  BACKEND API       │  ADMIN FRONTEND           │
│   (Vite + Vike SSR)  │  (NestJS + Fastify)│  (Vite + React)          │
├──────────────────────┼───────────────────┼───────────────────────────┤
│   /                   │  /api/v1/          │  /editorial/*             │
│   /news/:id           │  /auth/            │  /admin/*                 │
│   /category/:slug     │  /news/            │                           │
│   /search             │  /categories/      │  (отдельный bundle       │
│   /events/*           │  /comments/        │   или sub-app)           │
│   /ads/*              │  /events/          │                           │
│   /jobs/*             │  /ads/             │                           │
│   /realty/*           │  /jobs/            │                           │
│   /media/*            │  /realty/          │                           │
│   /weather/*          │  /media/           │                           │
│   /transport/*        │  /weather/         │                           │
│   /currency/*         │  /currency/        │                           │
│   /account/*          │  /users/           │                           │
│   /about/*            │  /search/          │                           │
│                       │  /notifications/   │                           │
│                       │  /analytics/       │                           │
│                       │  /editorial/       │                           │
│                       │  /admin/           │                           │
└──────────────────────┴───────────────────┴───────────────────────────┘
```

---

## Backend Module Architecture (NestJS)

```
apps/api/
├── src/
│   ├── main.ts                        # Entry: Fastify adapter, Swagger, CORS
│   ├── app.module.ts                  # Root module (imports all feature modules)
│   │
│   ├── common/                        # Shared cross-cutting
│   │   ├── decorators/                # @CurrentUser, @Roles, @Public
│   │   ├── guards/                    # JwtAuthGuard, RolesGuard, ThrottlerGuard
│   │   ├── interceptors/              # LoggingInterceptor, CacheInterceptor
│   │   ├── filters/                   # GlobalExceptionFilter
│   │   ├── pipes/                     # ValidationPipe (Zod)
│   │   └── dto/                       # Shared DTOs (pagination, sorting)
│   │
│   ├── modules/
│   │   ├── auth/                      # Register, login, refresh, OAuth, 2FA
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/            # JwtStrategy, OAuthStrategy
│   │   │   └── dto/
│   │   │
│   │   ├── users/                     # CRUD, profile, settings, roles
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── ...
│   │   │
│   │   ├── news/                      # Lifecycle: draft→review→published→archived
│   │   │   ├── news.module.ts
│   │   │   ├── news.controller.ts
│   │   │   ├── news.service.ts
│   │   │   ├── news.repository.ts
│   │   │   ├── news-content.repository.ts
│   │   │   ├── news-scheduler.service.ts  # Scheduled publishing
│   │   │   └── dto/
│   │   │
│   │   ├── comments/                  # Hierarchical, karma, moderation
│   │   │   ├── comments.module.ts
│   │   │   ├── comments.controller.ts
│   │   │   ├── comments.service.ts
│   │   │   ├── comments.repository.ts
│   │   │   └── ...
│   │   │
│   │   ├── categories/               # CRUD + tree
│   │   ├── tags/                      # CRUD + merge
│   │   ├── events/                    # Events (afisha)
│   │   ├── ads/                       # Classifieds + payments
│   │   ├── jobs/                      # Vacancies + resumes
│   │   ├── realty/                    # Real estate
│   │   ├── directory/                 # Organizations directory
│   │   ├── media/                     # File upload, processing, albums
│   │   ├── weather/                   # External API aggregation
│   │   ├── currency/                  # Exchange rates
│   │   ├── transport/                 # Flights, ferry, roads
│   │   ├── search/                    # Typesense index + sync
│   │   ├── notifications/            # Email/SMS/Push/Telegram
│   │   ├── newsletters/              # Digest generation + sending
│   │   ├── moderation/               # Auto + manual + ML
│   │   ├── analytics/                # Views, traffic, engagement
│   │   ├── billing/                  # Payments, subscriptions, tariffs
│   │   ├── advertising/              # Banners, campaigns, stats
│   │   └── admin/                    # System settings, logs, cache
│   │
│   └── infrastructure/
│       ├── database/                 # Prisma schema, migrations, seeds
│       ├── cache/                    # Redis client module
│       ├── queue/                    # BullMQ module
│       ├── search/                   # Typesense client module
│       ├── storage/                  # S3 client module
│       └── integration/              # External API clients
```

---

## Frontend Component Architecture

```
src/
├── main.tsx                           # Entry: providers (Theme, Favorites, Auth)
├── app.tsx                            # Layout + routing
│
├── routes/                            # Route config (централизованный)
│   └── index.ts                       # RouteDefinition[]
│
├── layouts/
│   ├── PublicLayout.tsx               # Navbar + Footer + ScrollProgress
│   ├── AccountLayout.tsx              # Account sidebar + header
│   ├── EditorialLayout.tsx            # Editorial sidebar
│   └── AdminLayout.tsx                # Admin sidebar
│
├── pages/
│   ├── public/                        # Public pages (everyone)
│   │   ├── HomePage/                  # index.tsx + components/ + hooks/
│   │   │   ├── index.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── BentoGrid.tsx
│   │   │   ├── VideoOfDay.tsx
│   │   │   ├── PhotoOfDay.tsx
│   │   │   ├── PollOfDay.tsx
│   │   │   └── ThemeOfDay.tsx
│   │   ├── ArticlePage/
│   │   ├── CategoryPage/
│   │   ├── SearchPage/
│   │   ├── EventsPage/
│   │   ├── AdsPage/
│   │   ├── JobsPage/
│   │   ├── RealtyPage/
│   │   ├── MediaPage/
│   │   ├── DirectoryPage/
│   │   ├── WeatherPage/
│   │   ├── TransportPage/
│   │   ├── CurrencyPage/
│   │   ├── TvPage/
│   │   ├── HoroscopePage/
│   │   ├── CrosswordsPage/
│   │   └── AboutPages/
│   │
│   ├── account/                       # Personal account pages
│   │   ├── ProfilePage/
│   │   ├── CommentsPage/
│   │   ├── FavoritesPage/
│   │   ├── SettingsPage/
│   │   ├── AdsPage/
│   │   ├── JobsPage/
│   │   ├── EventsPage/
│   │   ├── SubscriptionsPage/
│   │   ├── NotificationsPage/
│   │   ├── BillingPage/
│   │   └── SupportPage/
│   │
│   ├── editorial/                     # Editorial panel pages
│   │   ├── DashboardPage/
│   │   ├── NewsListPage/
│   │   ├── NewsCreatePage/
│   │   ├── NewsEditPage/
│   │   ├── CategoriesPage/
│   │   ├── TagsPage/
│   │   ├── EventsPage/
│   │   ├── MediaPage/
│   │   ├── CommentsPage/
│   │   ├── AdsPage/
│   │   ├── NewslettersPage/
│   │   ├── SeoPage/
│   │   └── AnalyticsPage/
│   │
│   └── admin/                         # Admin panel pages
│       ├── DashboardPage/
│       ├── UsersPage/
│       ├── StaffPage/
│       ├── ModerationPage/
│       ├── ContentPage/
│       ├── AdvertisingPage/
│       ├── BillingPage/
│       ├── SettingsPage/
│       └── SystemPage/
│
├── components/                        # Shared components
│   ├── ui/                            # shadcn/ui primitives (53)
│   ├── layout/                        # Navbar, Footer, ScrollProgress, Sidebars
│   ├── cards/                         # NewsCard, EventCard, AdCard, etc.
│   ├── widgets/                       # WeatherWidget, CurrencyWidget, EventsWidget
│   ├── search/                        # SearchBar, Autocomplete, FacetFilters
│   ├── comments/                      # CommentThread, CommentForm
│   ├── media/                         # Lightbox, VideoPlayer, Gallery
│   └── common/                        # Button, EmptyState, LoadingState, ErrorBoundary
│
├── hooks/                             # Shared hooks
│   ├── useTheme.ts
│   ├── useFavorites.ts
│   ├── useAuth.ts                     # Auth state + API calls
│   ├── useDebounce.ts
│   ├── useIntersectionObserver.ts
│   └── useMediaQuery.ts
│
├── services/                          # API client layer
│   ├── api-client.ts                  # Axios/fetch instance, interceptors
│   ├── auth.service.ts
│   ├── news.service.ts
│   ├── comments.service.ts
│   ├── search.service.ts
│   └── ...
│
├── stores/                            # Client state (Zustand)
│   ├── auth.store.ts
│   ├── ui.store.ts                    # Sidebar, modals, toasts
│   └── search.store.ts
│
├── types/                             # Shared types
│   └── index.ts
│
├── lib/                               # Utilities
│   └── utils.ts                       # cn(), formatters, validators
│
├── data/                              # Mock data (Phase 1, потом удалить)
│   └── mock.ts
│
└── styles/                            # Global styles
    └── index.css
```

---

## Routing Map

### Public Routes

| Path | Page | Layout | Auth |
|------|------|--------|------|
| `/` | HomePage | PublicLayout | - |
| `/news/:id` | ArticlePage | PublicLayout | - |
| `/category/:slug` | CategoryPage | PublicLayout | - |
| `/search` | SearchPage | PublicLayout | - |
| `/events` | EventsListPage | PublicLayout | - |
| `/events/:id` | EventDetailPage | PublicLayout | - |
| `/events/category/:slug` | EventsCategoryPage | PublicLayout | - |
| `/events/submit` | EventSubmitPage | PublicLayout | user |
| `/ads` | AdsListPage | PublicLayout | - |
| `/ads/:id` | AdDetailPage | PublicLayout | - |
| `/ads/submit` | AdSubmitPage | PublicLayout | user |
| `/jobs` | JobsListPage | PublicLayout | - |
| `/jobs/vacancies` | VacanciesPage | PublicLayout | - |
| `/jobs/resumes` | ResumesPage | PublicLayout | - |
| `/jobs/submit` | JobSubmitPage | PublicLayout | user |
| `/realty` | RealtyListPage | PublicLayout | - |
| `/realty/:id` | RealtyDetailPage | PublicLayout | - |
| `/realty/submit` | RealtySubmitPage | PublicLayout | user |
| `/media/photos` | PhotoGalleryPage | PublicLayout | - |
| `/media/videos` | VideoPage | PublicLayout | - |
| `/weather` | WeatherPage | PublicLayout | - |
| `/weather/:city` | WeatherCityPage | PublicLayout | - |
| `/transport` | TransportPage | PublicLayout | - |
| `/currency` | CurrencyPage | PublicLayout | - |
| `/tv` | TvProgramPage | PublicLayout | - |
| `/horoscope` | HoroscopePage | PublicLayout | - |
| `/crosswords` | CrosswordsPage | PublicLayout | - |
| `/directory` | DirectoryListPage | PublicLayout | - |
| `/directory/:cat` | DirectoryCategoryPage | PublicLayout | - |
| `/directory/:cat/:id` | DirectoryDetailPage | PublicLayout | - |
| `/about` | AboutPage | PublicLayout | - |
| `/about/advertising` | AdvertisingPage | PublicLayout | - |
| `/about/contacts` | ContactsPage | PublicLayout | - |
| `/login` | LoginPage | PublicLayout | guest |
| `/register` | RegisterPage | PublicLayout | guest |
| `/recover` | RecoverPage | PublicLayout | guest |
| `/oauth/:provider` | OAuthCallback | PublicLayout | - |

### Account Routes

| Path | Page | Auth |
|------|------|------|
| `/account` | AccountDashboardPage | user |
| `/account/profile` | ProfilePage | user |
| `/account/security` | SecurityPage | user |
| `/account/notifications` | NotificationSettingsPage | user |
| `/account/privacy` | PrivacyPage | user |
| `/account/comments` | MyCommentsPage | user |
| `/account/ads` | MyAdsPage | user |
| `/account/ads/:id/edit` | AdEditPage | user |
| `/account/jobs` | MyJobsPage | user |
| `/account/events` | MyEventsPage | user |
| `/account/subscriptions` | SubscriptionsPage | user |
| `/account/favorites` | FavoritesPage | user |
| `/account/notifications/list` | NotificationsListPage | user |
| `/account/billing` | BillingPage | user |
| `/account/support` | SupportTicketsPage | user |

### Editorial Routes

| Path | Auth |
|------|------|
| `/editorial` | staff |
| `/editorial/news` | staff |
| `/editorial/news/create` | journalist+ |
| `/editorial/news/:id/edit` | journalist+ |
| `/editorial/news/:id/preview` | staff |
| `/editorial/news/:id/history` | staff |
| `/editorial/news/:id/stats` | editor+ |
| `/editorial/categories` | editor+ |
| `/editorial/tags` | editor+ |
| `/editorial/events` | staff |
| `/editorial/events/moderation` | moderator+ |
| `/editorial/photos` | staff |
| `/editorial/videos` | staff |
| `/editorial/comments` | moderator+ |
| `/editorial/ads/moderation` | moderator+ |
| `/editorial/newsletters` | editor+ |
| `/editorial/seo` | editor+ |
| `/editorial/analytics` | editor+ |

### Admin Routes

| Path | Auth |
|------|------|
| `/admin` | admin |
| `/admin/users` | admin |
| `/admin/staff` | admin |
| `/admin/moderation` | admin |
| `/admin/content` | admin |
| `/admin/advertising` | admin |
| `/admin/billing` | admin |
| `/admin/settings` | superadmin |
| `/admin/system` | superadmin |

---

## Data Flow Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │     │   Vite SSR   │     │  NestJS API  │
│  (React SPA) │────▶│  (Vike)      │────▶│  (Fastify)   │
│              │     │              │     │              │
│  JS Bundle   │◀────│  SSR HTML    │◀────│  JSON/REST   │
│  Hydration   │     │  + Hydration │     │  + Swagger   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────┐
                    │                             │                     │
                    ▼                             ▼                     ▼
            ┌──────────────┐            ┌──────────────┐     ┌──────────────┐
            │  PostgreSQL  │            │    Redis     │     │  Typesense   │
            │  + Timescale │            │  (Cache/Qs)  │     │  (Search)    │
            └──────────────┘            └──────────────┘     └──────────────┘
                    │
                    ▼
            ┌──────────────┐
            │  S3 Storage  │
            │  (Images/    │
            │   Videos)    │
            └──────────────┘
```

### Request Flow (пример: создание новости)

```
1. Editor fills form → React state → validation (Zod)
2. Submit → POST /api/v1/news → JWT in Authorization header
3. NestJS Guard: JwtAuthGuard + RolesGuard (editor role)
4. ValidationPipe: Zod schema → DTO
5. NewsService.create():
   a. Transaction: INSERT news + INSERT news_content (version 1)
   b. BullMQ: schedule publish job (if publish_at in future)
   c. Invalidate: Redis cache for category page
   d. Index: Typesense UPSERT
   e. If is_urgent: send push notification via NotificationService
6. Response: 201 Created + NewsDTO
7. Frontend: toast "Новость создана" → redirect to /editorial/news/:id
```

---

## API Endpoint Structure

```
/api/v1/
├── /auth
│   ├── POST   /register              # Email + password + phone
│   ├── POST   /login                 # Email/password or SMS code
│   ├── POST   /refresh               # Refresh token
│   ├── POST   /oauth/{provider}      # Telegram, VK, Yandex
│   ├── POST   /logout
│   ├── POST   /recover               # Password reset
│   └── POST   /verify-2fa
│
├── /users/me
│   ├── GET    /                      # Profile
│   ├── PATCH  /                      # Update profile
│   ├── POST   /avatar                # Upload avatar
│   ├── GET    /settings              # User settings
│   ├── PATCH  /settings              # Update settings
│   └── GET    /stats                 # User statistics
│
├── /news
│   ├── GET    /                      # List (paginated, filtered)
│   ├── POST   /                      # Create (journalist+)
│   ├── GET    /:id                   # Single article
│   ├── PATCH  /:id                   # Update
│   ├── DELETE /:id                   # Soft delete (editor+)
│   ├── PATCH  /:id/status            # Status transition
│   ├── GET    /:id/comments          # Comments for article
│   ├── GET    /:id/stats             # View stats (editor+)
│   ├── GET    /:id/history           # Version history (editor+)
│   └── GET    /related/:id           # Related articles
│
├── /comments
│   ├── GET    /                      # List (filtered by news/user/status)
│   ├── POST   /                      # Create
│   ├── PATCH  /:id                   # Edit own comment
│   ├── DELETE /:id                   # Soft delete
│   ├── POST   /:id/vote              # Like/dislike
│   └── POST   /:id/report            # Report
│
├── /categories
│   ├── GET    /                      # Tree
│   ├── POST   /                      # Create (editor+)
│   └── PATCH  /:id                   # Update
│
├── /tags
│   ├── GET    /                      # List
│   ├── POST   /                      # Create
│   ├── POST   /merge                # Merge duplicates
│   └── DELETE /:id
│
├── /events (аналогично /ads, /jobs, /realty, /directory)
│   ├── GET    /                      # List (filters: date, category, city)
│   ├── POST   /                      # Create
│   ├── GET    /:id
│   ├── PATCH  /:id
│   └── DELETE /:id
│
├── /search
│   ├── GET    /                      # Full-text search
│   ├── GET    /suggest               # Autocomplete
│   ├── GET    /filters               # Facet options
│   └── POST   /vector                # Semantic search
│
├── /weather
│   ├── GET    /current               # All cities
│   ├── GET    /:city                 # Single city
│   ├── GET    /forecast/:city        # 10-day forecast
│   └── GET    /alerts                # Storm warnings
│
├── /notifications
│   ├── GET    /                      # User's notifications
│   ├── PATCH  /:id/read              # Mark as read
│   └── POST   /subscribe            # Push subscription
│
├── /editorial
│   ├── GET    /dashboard             # Editorial dashboard data
│   ├── GET    /newsletters           # Newsletter list
│   ├── POST   /newsletters           # Create newsletter
│   └── GET    /analytics/*           # Editorial analytics
│
├── /admin
│   ├── GET    /dashboard             # Admin dashboard
│   ├── GET    /users                 # User management
│   ├── PATCH  /users/:id/role        # Change role
│   ├── GET    /system/health         # System health
│   └── GET    /system/cache          # Cache management
│
└── /media
    ├── POST   /upload                # Upload file
    ├── GET    /:id                   # Get file metadata
    └── DELETE /:id                   # Delete file
```

---

## Technology Stack Summary

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend framework | Vite + React 19 + Vike (SSR) | Сохраняет текущий код, добавляет SSR |
| Component library | shadcn/ui + custom | Уже в проекте |
| Animation | Framer Motion 12 | Уже в проекте |
| Icons | Lucide React | Уже в проекте |
| Styling | Tailwind CSS 3 + CSS vars | Уже в проекте |
| Client state | Zustand | Легче Redux, типизирован |
| Server state | TanStack Query (React Query) | Кэш, ревалидация, SSR |
| Backend framework | NestJS + Fastify | TypeScript, модули, guards |
| ORM | Prisma | Type-safe, миграции, relations |
| Validation | Zod | Shared types front/back |
| DB | PostgreSQL 16 + TimescaleDB | Reliable + time-series |
| Cache | Redis 7 | Sessions, cache, queues |
| Search | Typesense + Elasticsearch | Speed + analytics |
| Queue | BullMQ (Redis) | Scheduled tasks, emails |
| Storage | S3 (Selectel / Yandex Cloud) | Images, videos, backups |
| Auth | Lucia + JWT + OAuth | Session management |
| RBAC | Casl | Ability-based permissions |
| Email | Resend / Mailgun | Transactional + digests |
| SMS | SMS.ru / Twilio | Verification, alerts |
| Push | Firebase Cloud Messaging | Browser push |
| Monitoring | Sentry + Grafana + Prometheus | Errors + metrics |
| CI/CD | GitHub Actions + Docker | Automated deploy |
| API docs | Swagger (via NestJS) | Auto-generated |

---

## Migration Path: Current → Target

### Phase 1 (Week 1-2): Foundation
- [ ] Set up NestJS project with Prisma + PostgreSQL
- [ ] Create database schema (migration)
- [ ] Implement auth module (register, login, JWT)
- [ ] Set up Vike for SSR on existing frontend
- [ ] Create API client layer on frontend
- [ ] Switch mock data to API calls (dual mode)

### Phase 2 (Week 3-6): Core API
- [ ] News CRUD + lifecycle
- [ ] Categories + Tags API
- [ ] Comments API + karma system
- [ ] Search (Typesense integration)
- [ ] Media upload (S3)

### Phase 3 (Week 7-10): Feature API
- [ ] Events, Ads, Jobs, Realty
- [ ] Directory
- [ ] Weather + Currency aggregation
- [ ] Transport integration
- [ ] Search with facets + autocomplete

### Phase 4 (Week 11-14): User features
- [ ] Personal account API
- [ ] Editorial panel API
- [ ] Favorites + subscriptions
- [ ] Notifications (Email/SMS/Push)

### Phase 5 (Week 15-18): Advanced
- [ ] Admin panel API
- [ ] Moderation system
- [ ] Recommendation engine
- [ ] Newsletters + digests
- [ ] Analytics

### Phase 6 (Week 19-22): Polish
- [ ] Payments + billing
- [ ] Advertising system
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Final testing + deploy
