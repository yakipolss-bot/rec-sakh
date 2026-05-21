# План перехода с моков на реальное API

## Текущее состояние

### ✅ Уже на реальном API
- **Account** — Dashboard (index), Profile, Subscription CRUD (частично)
- **Editorial** — Layout, Dashboard, NewsList, NewsCreate
- **Базовые сервисы** — auth, users, news, categories

### ❌ На моках (нужно мигрировать)
| Приоритет | Область | Страницы | Файлы моков |
|---|---|---|---|
| **P0** | **Admin** (вся) | 12 страниц | `adminMock.ts` |
| **P1** | **Editorial** (остальные) | 8 страниц | `editorialMock.ts`, части `mock.ts` |
| **P1** | **Account** (пустые) | 8 страниц | — (пустые заглушки) |
| **P2** | **Account** (остальные) | favorites, events, subscriptions | `mock.ts`, `accountMock.ts` |
| **P2** | **Публичные страницы** | Home, Article, Category, Search | `mock.ts` (новости) |
| **P3** | **Виджеты** | EventsWidget, AccountSettings | `mock.ts`, `accountMock.ts` |

## Поэтапный план

### Этап 1: Admin (P0)
Бэкенд уже имеет модуль `admin` с эндпоинтами. Нужны сервисы во фронтенде и замена моков:

| Страница | Что делает |
|---|---|
| AdminLayout | Заменить `currentUser` из mock на `usersService.getMe()` |
| index (Dashboard) | Статистика, последние действия, алерты — API есть в `admin.controller.ts` |
| users | Список пользователей — API в `users.service.ts` |
| users-id | Деталка пользователя + лог активности |
| users-roles | Роли и разрешения |
| staff | Сотрудники + графики |
| moderation | Очередь модерации + правила — API в `admin.controller.ts` |
| content | Контент (страницы, баннеры, меню) |
| advertising | Рекламные кампании |
| billing | Все транзакции |
| settings | Настройки системы |
| system | Мониторинг (healthcheck) |

### Этап 2: Editorial (P1)
| Страница | Что делает |
|---|---|
| EditorialComments | Модерация комментариев — API есть в `comments` модуле |
| EditorialNewsComments | Комментарии к конкретной новости |
| EditorialCategories | CRUD категорий — API в `categories.service.ts` |
| EditorialTags | CRUD тегов + merge — API в `tags` модуле |
| EditorialEvents | CRUD событий — API в `events` модуле |
| EditorialMedia | CRUD медиафайлов — API в `media` модуле |
| EditorialAnalytics | Аналитика — API в `admin/analytics.service.ts` |
| EditorialAds | Модерация объявлений |
| EditorialSeo | Редиректы и битые ссылки |
| EditorialNewsletters | Рассылки — API в `notifications/newsletter.service.ts` |

### Этап 3: Account (P1)
Заполнить 8 пустых страниц реальными данными:
| Страница | API |
|---|---|
| notifications | `notifications` модуль |
| security | `usersService.changePassword()` + 2FA |
| billing | `billing` модуль |
| support | Тикеты поддержки |
| comments | `comments` модуль |
| ads | `ads` модуль |
| jobs | `jobs` модуль |
| privacy | `usersService.updateProfile()` |

### Этап 4: Публичные страницы (P2)
| Страница | API |
|---|---|
| HomePage | `newsService.getNews()` + `categoriesService.getCategories()` |
| ArticlePage | `newsService.getNews(id)` |
| CategoryPage | `newsService.getNews()` фильтр по категории |
| SearchPage | `newsService.getNews()` + поиск |
| EventsPage | `events` модуль |
| EventDetailPage | `events` модуль |

### Этап 5: Виджеты (P3)
| Компонент | API |
|---|---|
| EventsWidget | `events` модуль |
| AccountSettings | `usersService.getMe()` |

## Технические требования
- Каждую страницу проверять: работает ли CRUD, пагинация, фильтры, поиск
- Удалять импорты моков после замены (чтобы не осталось мёртвого кода)
- Файлы моков (`mock.ts`, `adminMock.ts`, `accountMock.ts`, `editorialMock.ts`) удалить только когда все импорты заменены

## Статус готовности бэкенда
Из 19 модулей NestJS — **все существуют**. Но не все эндпоинты могут быть полностью реализованы. В процессе перехода может потребоваться доработка отдельных ручек.
