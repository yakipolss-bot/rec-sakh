# Handoff

## Цель
Полный аудит и доработка портала — убрать мок-данные, заглушки и неработающие элементы со всех страниц. Подключить реальные API, заменить пустые состояния на рабочий функционал.

## Текущее состояние
- Все страницы портала отрефакторены — мок-данные удалены, компоненты подключены к TanStack Query и реальным API
- Бэкенд работает через API-прокси на `localhost:3001/api`
- Аутентификация через Supabase + собственная роль-модель
- Роутинг через Vike (file-system routing) + RouteGuard для ролей
- ✅ ASTV-парсер: свежие новости с `astv.ru` автоматически загружаются каждые 15 минут

### Статус страниц
- ✅ **Публичные** (HomePage, AboutPages, AdsPage, AdDetailPage, AdSubmitPage, ArticlePage, CategoryPage, SearchPage, WeatherPage, TransportPage, CurrencyPage, DirectoryPage, RealtyPage, EventsPage, EventDetailPage, EventSubmitPage, JobsPage, GptPage, TvPage, HoroscopePage, CrosswordsPage, StaticPage, MediaPage) — полностью рабочие, данные с API
- ✅ **Аккаунт** (все 15 страниц) — рабочие, данные с API
- ✅ **Админка** (все страницы) — рабочие, данные с API
- ✅ **Редакторка** (все 18 страниц) — рабочие, данные с API

### Осталось
| # | Где | Что | Статус |
|---|-----|-----|--------|
| 1 | `admin/content.tsx:212` | Кнопка "Редактировать" статических страниц | ✅ сделано — ведёт на `/editorial/pages/:slug` |
| 2 | `admin/users-roles.tsx:45` | Кнопка "Добавить роль" | ✅ сделано — модалка с правами доступа |
| 3 | `editorial/EditorialAnalytics.tsx:169` | Вкладка "Поисковая аналитика" | ✅ сделано — вывод популярных запросов |

## Что изменилось

### Последние изменения
- ✅ **Редактор статических страниц** — новый компонент `EditorialStaticPageEdit.tsx`, роут `/editorial/pages/:slug`
- ✅ **Добавление ролей** — модалка с правами доступа, бэкенд-эндпоинт `POST /admin/roles`
- ✅ **Поисковая аналитика** — вкладка с популярными запросами, бэкенд на `auditLog`
- ✅ **ASTV-парсер новостей** — `AstvNewsScannerService`, парсит RSS `https://astv.ru/rss/lenta/` каждые 15 минут, маппинг категорий ASTV → внутренние, дедупликация по `sourceUrl`

### Структура проекта
```
C:\Sakhcom_для_Сахалина\
├── app/                              # Frontend (Vike + React 19 + TanStack Query)
├── apps/api/                         # Backend (NestJS 11 + Prisma + PostgreSQL)
│   └── src/modules/
│       ├── news-sync/                # [NEW] ASTV-парсер новостей
│       ├── events-sync/              # Парсеры событий (afisha65, chekhov-center)
│       ├── news/                     # Новостной модуль
│       └── ...
├── *.md                              # Документация
└── docker-compose.yml
```

### Убраны мок-данные
- `currencyPage.tsx` — хардкодный курс валют → API ЦБ РФ
- `AdSubmitPage.tsx` — нет API → localStorage CRUD
- `TransportPage.tsx` — хардкодный список → API с PDF-парсингом
- `EventsPage.tsx` — хардкодные события → API

### Починены неработающие элементы
- `to="#"` в 5 местах → правильные ссылки
- `console.log` в 4 местах → удалены
- Пустые страницы-заглушки в аккаунте → реальный функционал с API
- `admin/content.tsx` "Просмотр" → navigate(p.url) вместо toast
- `admin/content.tsx` виджеты → toggle с localStorage вместо toast

## Запуск
```bash
# Frontend
cd app && npm run dev

# Backend
cd apps/api && npm run start:dev
```
