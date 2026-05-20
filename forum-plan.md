# План форума для rec-sakh

## Цель
Добавить форум в существующий проект (NestJS + Vike + Prisma + Supabase), взяв за референс схему и логику из Rhex (lovedevpanda/Rhex), но без Next.js.

## Этап 1. Prisma — модели форума
Добавить в `apps/api/prisma/schema.prisma`:

- **Zone** — раздел первого уровня (например «Город», «Транспорт», «Общение»)
- **Board** — доска/подраздел внутри зоны (например «Новости Южно-Сахалинска», «Авто», «Курилка»)
- **Post** — тема/пост с заголовком, Markdown-контентом, slug
- **PostTag** — связь пост-тег (M:N)
- **Tag** — теги (уже есть в проекте, можно переиспользовать или создать отдельные)
- **Comment** — тредовые комментарии (parentId для вложенности, replyToUserId)
- **PostLike** — лайки постов (переиспользовать существующий механизм или свой)
- **PostBookmark** — избранное
- **PostFollow** — подписка на обновления поста
- **BoardFollow** — подписка на доску
- **BoardModerator** — модераторы доски

Поля User добавить: `postCount`, `commentCount`, `lastPostAt`, `lastCommentAt`.

**Интеграция с существующим User:** у нас уже есть модель User с id(UUID), email, name, avatarUrl, role. Форум использует её — никакой дублирующей регистрации.

## Этап 2. NestJS — модули форума

```
apps/api/src/modules/forum/
├── forum.module.ts
├── zones/
│   ├── zone.controller.ts
│   ├── zone.service.ts
│   └── dto/
├── boards/
│   ├── board.controller.ts
│   ├── board.service.ts
│   └── dto/
├── posts/
│   ├── post.controller.ts
│   ├── post.service.ts
│   └── dto/
├── comments/
│   ├── comment.controller.ts
│   ├── comment.service.ts
│   └── dto/
└── tags/
    ├── tag.controller.ts
    ├── tag.service.ts
    └── dto/
```

Endpoints:
| Метод | Путь | Описание |
|---|---|---|
| GET | /api/v1/forum/zones | Список разделов |
| GET | /api/v1/forum/boards?zoneId= | Список досок в разделе |
| GET | /api/v1/forum/posts?boardId=&page=&sort= | Посты в доске (с пагинацией, сортировка по new/hot/top) |
| POST | /api/v1/forum/posts | Создать пост (Auth) |
| GET | /api/v1/forum/posts/:slug | Деталка поста |
| PATCH | /api/v1/forum/posts/:id | Редактировать пост (Auth, автор/модератор) |
| DELETE | /api/v1/forum/posts/:id | Удалить пост (Auth, автор/модератор) |
| GET | /api/v1/forum/posts/:id/comments | Комментарии поста (тредовые) |
| POST | /api/v1/forum/posts/:id/comments | Создать комментарий (Auth) |
| POST | /api/v1/forum/comments/:id | Ответить на комментарий (Auth) |
| PATCH | /api/v1/forum/comments/:id | Редактировать комментарий |
| DELETE | /api/v1/forum/comments/:id | Удалить комментарий |
| POST | /api/v1/forum/posts/:id/like | Лайк/анлайк (Auth) |
| POST | /api/v1/forum/posts/:id/bookmark | Закладка (Auth) |
| POST | /api/v1/forum/boards/:id/follow | Подписка на доску (Auth) |
| GET | /api/v1/forum/tags | Все теги |
| GET | /api/v1/forum/search?q= | Поиск по постам |

Все ручки используют существующую JWT-авторизацию (Bearer token из Supabase).

## Этап 3. Frontend — страницы форума

```
app/src/pages/forum/
├── ForumLayout.tsx           # Лейаут с навигацией по зонам/доскам
├── ForumIndexPage.tsx        # /forum — список зон и досок
├── BoardPage.tsx             # /forum/board/:slug — список постов
├── PostPage.tsx              # /forum/post/:slug — пост + комментарии
├── NewPostPage.tsx           # /forum/new — создать пост (Auth)
├── EditPostPage.tsx          # /forum/edit/:id — редактировать (Auth)
├── SearchPage.tsx            # /forum/search — поиск
└── components/
    ├── PostCard.tsx           # Карточка поста в списке
    ├── PostContent.tsx        # Markdown-рендер пост
    ├── CommentTree.tsx        # Дерево комментариев
    ├── CommentForm.tsx        # Форма нового комментария
    ├── BoardSidebar.tsx       # Сайдбар доски
    └── ForumBreadcrumbs.tsx   # Хлебные крошки
```

Роуты добавить в `app/pages/catch-all/+Page.tsx`:
- `/forum` → ForumIndexPage
- `/forum/board/:slug` → BoardPage
- `/forum/post/:slug` → PostPage
- `/forum/new` → NewPostPage (ProtectedRoute)
- `/forum/edit/:id` → EditPostPage (ProtectedRoute)
- `/forum/search` → SearchPage

Визуал — существующий Tailwind UI портала (те же цвета, шрифты, компоненты). Markdown-рендер через `markdown-it` (как в Rhex).

## Этап 4. Деплой
- Миграция Prisma: `prisma migrate dev --name add_forum_models`
- Всё в том же `apps/api` — модуль форума в существующем NestJS
- Все страницы в `app/src/pages/forum/` — в существующем Vike
- Общий CI/CD, один домен, один деплой

## Срок
Оценка: **5-7 дней** (3 дня бэкенд + 2-3 дня фронтенд + 1 день интеграция/тесты).
