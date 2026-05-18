# REST API Specification — Sakhcom Portal

**Architecture**: Modular monolith (NestJS + Fastify) → future microservices  
**Protocol**: REST over HTTPS  
**Base URL**: `https://api.sakhcom.ru/v1`  
**Format**: JSON  
**Auth**: JWT (Bearer) + Refresh Tokens + OAuth 2.0  
**Pagination**: Offset-based (page/perPage) + Cursor-based for feeds  
**Documentation**: Swagger (auto-generated via `@nestjs/swagger`)

---

## 1. Standard Response Envelope

### Success (single)
```json
{ "data": {}, "meta": { "requestId": "uuid", "timestamp": "ISO8601" } }
```

### Success (collection)
```json
{ "data": [], "meta": { "page": 1, "perPage": 20, "total": 147, "totalPages": 8, "requestId": "uuid", "timestamp": "ISO8601" } }
```

### Error
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "string", "details": [{ "field": "title", "message": "Обязательное поле", "code": "REQUIRED" }], "requestId": "uuid", "timestamp": "ISO8601" } }
```

---

## 2. Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Ошибка валидации полей |
| 401 | `UNAUTHORIZED` | Не авторизован |
| 401 | `TOKEN_EXPIRED` | Токен истёк |
| 403 | `FORBIDDEN` | Нет прав (role < required) |
| 404 | `NOT_FOUND` | Ресурс не найден |
| 409 | `CONFLICT` | Дубликат (email занят) |
| 409 | `INVALID_STATUS_TRANSITION` | Недопустимый переход статуса |
| 422 | `UNPROCESSABLE_ENTITY` | Нарушение бизнес-правила |
| 429 | `RATE_LIMIT_EXCEEDED` | Превышен лимит запросов |
| 500 | `INTERNAL_ERROR` | Внутренняя ошибка |

---

## 3. Authentication Flow

```
Register → { user, accessToken(1h), refreshToken(30d) }
Login    → { user, accessToken, refreshToken }
Refresh  → Header X-Refresh-Token → { accessToken, refreshToken }
Logout   → revoke tokens → 204
Recover  → email → send reset link
```

### JWT Payload
```json
{ "sub": "user_uuid", "role": "user", "permissions": ["comment:create"], "iat": 1715846400, "exp": 1715850000 }
```

### Headers
```
Authorization: Bearer <access_token>
X-Refresh-Token: <refresh_token>
X-Idempotency-Key: <uuid>     // POST/PATCH idempotency, 24h
X-Request-Id: <uuid>          // tracing
Accept-Language: ru
```

---

## 4. RBAC Matrix

| Role | Level | Key Permissions |
|------|-------|-----------------|
| `guest` | 0 | news:read, search:basic |
| `user` | 10 | + comment:create, favorites:*, ads:create |
| `journalist` | 20 | + news:create, news:edit_own, media:upload |
| `proofreader` | 30 | + news:edit_any, comments:moderate |
| `editor` | 40 | + categories:manage, events:publish, newsletters:create |
| `chief_editor` | 50 | + news:status:any, staff:manage, analytics:view |
| `moderator` | 25 | + comments:moderate, ads:moderate, users:report |
| `admin` | 90 | + users:manage, roles:manage, billing:read |
| `superadmin` | 100 | + settings:system, logs:view, impersonate |

---

## 5. Rate Limiting

| Tier | Limit | Window | Scope |
|------|-------|--------|-------|
| Guest | 30 req/min | 1 min | IP |
| User | 100 req/min | 1 min | User ID |
| Staff | 300 req/min | 1 min | User ID |
| Auth | 10 req/min | 1 min | IP |
| Search | 60 req/min | 1 min | IP/User |
| Media upload | 10 req/hour | 1 hour | User ID |
| Comments POST | 20 req/hour | 1 hour | User ID |

---

## 6. Endpoints

### 6.1 Auth (`/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | - | Регистрация (email + phone + password) → 201 |
| POST | `/auth/login` | - | Вход по email/password → 200 |
| POST | `/auth/login/sms` | - | Вход по SMS-коду → 200 |
| POST | `/auth/refresh` | RT | Обновление токенов → 200 |
| POST | `/auth/logout` | JWT | Выход → 204 |
| POST | `/auth/recover` | - | Восстановление пароля → 202 |
| POST | `/auth/reset-password` | - | Сброс пароля по токену → 204 |
| POST | `/auth/oauth/{provider}` | - | OAuth (telegram/vk/yandex) → 200 |
| POST | `/auth/verify-phone` | JWT | Подтверждение телефона → 204 |
| POST | `/auth/2fa/setup` | JWT | Настройка 2FA → { secret, qrCode } |
| POST | `/auth/2fa/verify` | JWT | Проверка TOTP → 200 |
| DELETE | `/auth/2fa` | JWT | Отключение 2FA → 204 |

### 6.2 Users (`/api/v1/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | JWT | Профиль текущего пользователя |
| PATCH | `/users/me` | JWT | Обновление профиля |
| POST | `/users/me/avatar` | JWT | Загрузка аватара (multipart) |
| GET | `/users/me/settings` | JWT | Настройки уведомлений/приватности |
| PATCH | `/users/me/settings` | JWT | Обновление настроек |
| GET | `/users/me/stats` | JWT | Статистика (karma, level, counts) |
| DELETE | `/users/me` | JWT | Удаление аккаунта (soft, 30d recovery) |
| GET | `/users/:id` | - | Публичный профиль пользователя |

### 6.3 News (`/api/v1/news`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/news` | - | Список новостей (фильтры: category, tag, city, author, status, dateFrom, dateTo, search, isUrgent, hasVideo, sort, page) |
| POST | `/news` | journalist+ | Создание новости |
| GET | `/news/:id` | - | Полная новость |
| PATCH | `/news/:id` | journalist+ | Редактирование (own) |
| DELETE | `/news/:id` | editor+ | Удаление (soft) |
| PATCH | `/news/:id/status` | editor+ | Смена статуса (draft→review→published→archived) |
| GET | `/news/:id/comments` | - | Комментарии к новости (tree) |
| GET | `/news/:id/stats` | editor+ | Статистика просмотров |
| GET | `/news/:id/history` | editor+ | История версий |
| GET | `/news/related/:id` | - | Похожие новости (3-5) |

#### Status transitions
```
draft → review → published → archived
  ↑       ↓
  └── rejected ──┘
```

### 6.4 Comments (`/api/v1/comments`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/comments` | JWT | Создать комментарий (newsId, parentId?, content) → 201 |
| PATCH | `/comments/:id` | JWT | Редактировать свой (24h window) |
| DELETE | `/comments/:id` | JWT/moderator+ | Удалить (soft) |
| POST | `/comments/:id/vote` | JWT | Голосовать (like/dislike/null) |
| POST | `/comments/:id/report` | JWT | Пожаловаться (reason: spam/abuse/offtopic) |
| GET | `/comments/moderation` | moderator+ | Очередь модерации |
| PATCH | `/comments/:id/moderate` | moderator+ | approve/reject |
| GET | `/comments/blacklist` | moderator+ | Список запрещённых слов |
| POST | `/comments/blacklist` | moderator+ | Добавить слова в blacklist |
| GET | `/comments/reported` | moderator+ | Жалобы пользователей |

### 6.5 Events / Афиша (`/api/v1/events`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/events` | - | Список (category, city, dateFrom, dateTo, priceMin, priceMax, isFree, search, page) |
| POST | `/events` | JWT | Создать (title, description, category, startDate, venue, price?, image, recurrence?) |
| GET | `/events/:id` | - | Детально |
| PATCH | `/events/:id` | owner/editor+ | Редактировать |
| DELETE | `/events/:id` | editor+ | Удалить |
| GET | `/events/categories` | - | Категории событий |
| POST | `/events/:id/subscribe` | JWT | Подписаться на изменения |

### 6.6 Ads (`/api/v1/ads`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/ads` | - | Список (category, city, priceMin, priceMax, condition, sort, page) |
| POST | `/ads` | JWT | Создать (title, description, category, price, images, phone) |
| GET | `/ads/:id` | - | Детально |
| PATCH | `/ads/:id` | owner | Редактировать |
| DELETE | `/ads/:id` | owner/moderator+ | Удалить |
| POST | `/ads/:id/promote` | owner | Продвижение (raise/highlight/urgent/vip) + payment |
| GET | `/ads/:id/stats` | owner | Статистика просмотров |
| GET | `/ads/categories` | - | Категории объявлений (tree) |

### 6.7 Jobs (`/api/v1/jobs`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/jobs` | - | Список (type: vacancy/resume, category, city, salaryMin, salaryMax, schedule, page) |
| POST | `/jobs` | JWT | Создать (type, title, description, salary?, schedule, experience, contacts) |
| GET | `/jobs/:id` | - | Детально |
| PATCH | `/jobs/:id` | owner | Редактировать |
| DELETE | `/jobs/:id` | owner/moderator+ | Удалить |
| POST | `/jobs/:id/respond` | JWT | Откликнуться (message?, resumeId?) |
| GET | `/jobs/responses` | owner | Мои отклики |

### 6.8 Realty (`/api/v1/realty`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/realty` | - | Список (type: sale/rent/newbuild, city, priceMin, priceMax, rooms, page) |
| POST | `/realty` | JWT | Создать |
| GET | `/realty/:id` | - | Детально (с картой) |
| PATCH | `/realty/:id` | owner | Редактировать |
| DELETE | `/realty/:id` | owner/moderator+ | Удалить |

### 6.9 Directory (`/api/v1/directory`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/directory` | - | Список организаций (category, city, search, rating, page) |
| POST | `/directory` | editor+ | Добавить организацию |
| GET | `/directory/:id` | - | Карточка организации (with reviews) |
| PATCH | `/directory/:id` | editor+ | Редактировать |
| DELETE | `/directory/:id` | editor+ | Удалить |
| POST | `/directory/:id/review` | JWT | Оставить отзыв (rating 1-5, text) |
| GET | `/directory/categories` | - | Категории справочника |

### 6.10 Media (`/api/v1/media`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/media/upload` | JWT | Загрузить файл (multipart, max 50MB, type: image/video/document) → 201 |
| DELETE | `/media/:id` | owner/moderator+ | Удалить |
| POST | `/media/albums` | JWT | Создать альбом |
| GET | `/media/albums` | - | Список альбомов |
| GET | `/media/albums/:id` | - | Альбом с медиафайлами |

### 6.11 Weather (`/api/v1/weather`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/weather/current` | - | Погода во всех городах |
| GET | `/weather/forecast/:city` | - | Прогноз на 10 дней |
| GET | `/weather/alerts` | - | Штормовые предупреждения |
| GET | `/weather/cities` | - | Список городов с приоритетами |

### 6.12 Currency (`/api/v1/currency`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/currency/rates` | - | Курсы валют (USD, JPY, KRW, CNY) |
| GET | `/currency/converter` | - | Конвертер (from, to, amount → result) |
| GET | `/currency/history/:code` | - | История курса (period: 7d/30d/90d/1y) |

### 6.13 Transport (`/api/v1/transport`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/transport/flights` | - | Табло аэропорта (direction, date) |
| GET | `/transport/ferry` | - | Паромы (route: vanino-kholmsk/korsakov-wakkanai) |
| GET | `/transport/roads` | - | Состояние дорог |
| GET | `/transport/schedule` | - | Расписание (type: bus/train, city) |

### 6.14 Search (`/api/v1/search`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search` | - | Полнотекстовый поиск (q, type, category, city, filters, sort, page) + facets |
| GET | `/search/suggest` | - | Автокомплит (q, type → suggestions) |
| POST | `/search/vector` | - | Семантический поиск (q → vector embeddings) |

### 6.15 Notifications (`/api/v1/notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | JWT | Список уведомлений (type, unreadOnly, page) |
| PATCH | `/notifications/:id/read` | JWT | Отметить прочитанным |
| POST | `/notifications/read-all` | JWT | Всё прочитано |
| POST | `/notifications/push-subscribe` | JWT | Подписаться на push (endpoint, keys) |
| DELETE | `/notifications/push-subscribe` | JWT | Отписаться от push |

### 6.16 Newsletters (`/api/v1/newsletters`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/newsletters` | editor+ | Список рассылок |
| POST | `/newsletters` | editor+ | Создать (type: digest/urgent/thematic, content, scheduledAt, targetAudience) |
| GET | `/newsletters/:id/stats` | editor+ | Статистика (sent, opened, clicked, unsubscribed) |

### 6.17 Moderation (`/api/v1/moderation`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/moderation/queue` | moderator+ | Очередь (type: comment/ad/event, status: pending, page) |
| PATCH | `/moderation/queue/:id` | moderator+ | approve/reject |
| GET | `/moderation/rules` | admin+ | Правила авто-модерации |
| PATCH | `/moderation/rules` | admin+ | Обновить правила (blacklist, thresholds) |

### 6.18 Analytics (`/api/v1/analytics`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/traffic` | editor+ | Посещаемость (period, visitors, sources, devices, geo) |
| GET | `/analytics/content` | editor+ | Топ материалов (views, readTime, scrollDepth) |
| GET | `/analytics/authors` | editor+ | Статистика по авторам |
| GET | `/analytics/realtime` | editor+ | Онлайн сейчас |

### 6.19 Billing (`/api/v1/billing`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/billing` | JWT | Баланс, подписка, последние транзакции |
| POST | `/billing/payment` | JWT | Пополнение (amount, method: card/sbp/crypto) → paymentUrl |
| GET | `/billing/transactions` | JWT | История операций |
| POST | `/billing/subscriptions` | JWT | Оформить подписку (tariffId) |
| DELETE | `/billing/subscriptions/:id` | JWT | Отменить подписку |
| GET | `/billing/tariffs` | - | Тарифы Sakhcom+ |

### 6.20 Advertising (`/api/v1/advertising`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/advertising/placements` | admin+ | Рекламные места |
| POST | `/advertising/campaigns` | admin+ | Создать кампанию |
| GET | `/advertising/stats` | admin+ | Статистика (impressions, clicks, CTR, revenue) |

### 6.21 Admin (`/api/v1/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/health` | superadmin | Здоровье системы (DB, Redis, Typesense, S3, queue) |
| GET | `/admin/users` | admin+ | Список пользователей (role, status, search, page) |
| GET | `/admin/users/:id` | admin+ | Карточка пользователя |
| PATCH | `/admin/users/:id/role` | admin+ | Сменить роль |
| POST | `/admin/users/:id/impersonate` | admin+ | Войти под пользователем |
| GET | `/admin/staff` | admin+ | Сотрудники редакции |
| PATCH | `/admin/staff/:id/permissions` | admin+ | Матрица доступа |
| GET | `/admin/settings` | superadmin | Настройки сайта |
| PATCH | `/admin/settings` | superadmin | Обновить настройки |
| DELETE | `/admin/system/cache` | superadmin | Сбросить кэш (keys или "all") |
| GET | `/admin/system/logs` | superadmin | Системные логи |

---

## 7. WebSocket Events

**Endpoint**: `wss://api.sakhcom.ru/v1/ws?token=<jwt>`

### Client → Server
```json
{ "type": "subscribe", "channel": "news:uuid" }
{ "type": "unsubscribe", "channel": "news:uuid" }
{ "type": "ping" }
```

### Server → Client
```json
{ "type": "comment:new", "data": { "newsId": "...", "comment": {...} } }
{ "type": "comment:vote", "data": { "commentId": "...", "likes": 13 } }
{ "type": "news:urgent", "data": { "newsId": "...", "title": "..." } }
{ "type": "notification", "data": { "notification": {...} } }
{ "type": "moderation:queue", "data": { "type": "comment", "count": 47 } }
{ "type": "pong" }
```

---

## 8. Caching Strategy

| Endpoint | Cache Type | TTL | Invalidation |
|----------|-----------|-----|--------------|
| GET /news | HTTP (CDN) | 60s | On publish/update |
| GET /news/:id | HTTP (CDN) | 300s | On update |
| GET /categories | Redis | 3600s | On category change |
| GET /weather | Redis | 600s | Per fetch |
| GET /currency | Redis | 1800s | Per fetch |
| GET /search | Redis | 120s | On new content |
| GET /search/suggest | Edge/CDN | 3600s | Per rebuild |
| GET /users/me | Redis | 60s | On profile update |
| GET /notifications | Redis | 30s | On new notification |

---

## 9. Typesense Index Schema

### Collection: `news`
```json
{
  "name": "news",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "title", "type": "string", "locale": "ru" },
    { "name": "lead", "type": "string", "locale": "ru" },
    { "name": "content", "type": "string", "locale": "ru" },
    { "name": "tags", "type": "string[]", "facet": true },
    { "name": "category", "type": "string", "facet": true },
    { "name": "author", "type": "string", "facet": true },
    { "name": "city", "type": "string", "facet": true },
    { "name": "publishedAt", "type": "int64" },
    { "name": "views", "type": "int32" },
    { "name": "commentsCount", "type": "int32" },
    { "name": "hasVideo", "type": "bool" },
    { "name": "isUrgent", "type": "bool" },
    { "name": "popularityScore", "type": "float" },
    { "name": "vectorEmbedding", "type": "float[]", "numDim": 384, "optional": true }
  ],
  "defaultSortingField": "popularityScore"
}
```

---

## 10. Key Data Models

### NewsArticle (full)
```json
{
  "id": "uuid", "slug": "string", "title": "string", "lead": "string", "content": "string",
  "mainImage": { "url": "...", "thumbnailUrl": "..." },
  "gallery": [{ "url": "...", "alt": "...", "width": 1920, "height": 1080 }],
  "video": { "url": "...", "type": "youtube|upload", "duration": 187 },
  "category": { "id": "uuid", "name": "Общество", "slug": "obshchestvo" },
  "tags": [{ "id": "uuid", "name": "Сахалин" }],
  "author": { "id": "uuid", "name": "Иван Петров" },
  "city": "yuzhno-sakhalinsk",
  "status": "published", "isUrgent": false, "isPremium": false,
  "publishedAt": "ISO8601", "createdAt": "ISO8601", "updatedAt": "ISO8601",
  "views": 12347, "commentsCount": 34, "readingTime": 3,
  "source": { "name": "ТАСС", "url": "https://..." },
  "seo": { "title": "...", "description": "...", "ogImage": "https://..." }
}
```

### Comment (tree)
```json
{
  "id": "uuid",
  "author": { "id": "uuid", "name": "Алексей", "avatar": "...", "level": "regular" },
  "content": "Отличная статья!",
  "createdAt": "ISO8601",
  "likes": 12, "dislikes": 1,
  "isLiked": false, "isPinned": false,
  "replies": [ /* nested, max 3 levels */ ]
}
```

### SearchResult
```json
{
  "type": "news|events|ads|jobs|directory",
  "id": "uuid",
  "title": "Штормовое предупреждение...",
  "lead": "Ветер до 25 м/с...",
  "image": "https://...",
  "url": "/news/slug",
  "publishedAt": "ISO8601",
  "category": { "name": "Происшествия", "slug": "proisshestviya" },
  "city": "Южно-Сахалинск",
  "views": 12347, "isUrgent": true,
  "score": 0.95,
  "explain": "Совпадение в заголовке"
}
```

---

## 11. C4 Context Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Sakhcom Portal                         │
│                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌───────────────┐  │
│  │  Vite SSR    │   │  NestJS API  │   │  Admin/Editor │  │
│  │  (React 19)  │──▶│  (Fastify)   │◀──│  (React SPA)  │  │
│  └──────┬──────┘   └──────┬───────┘   └───────────────┘  │
│         │                 │                               │
│         ▼                 ▼                               │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │  PostgreSQL   │  │    Redis     │                      │
│  │  + Timescale  │  │  (Cache/Qs)  │                      │
│  └──────────────┘  └──────┬───────┘                      │
│                           │                               │
│                    ┌──────▼───────┐                      │
│                    │  Typesense   │                      │
│                    │  (Search)    │                      │
│                    └──────────────┘                      │
│                                                          │
│  External:                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │OpenWeather│ │  ЦБ РФ   │ │  СБП/    │ │  Telegram  │  │
│  │  Map API  │ │  API     │ │  ЮKassa  │ │  Bot API   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 12. OpenAPI Documentation

Generated automatically via `@nestjs/swagger`:
- `https://api.sakhcom.ru/docs` — Swagger UI
- `https://api.sakhcom.ru/docs-json` — OpenAPI JSON
- `https://api.sakhcom.ru/docs-yaml` — OpenAPI YAML
