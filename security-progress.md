# Security Audit Progress

## Шаг 1.1: JWT Algorithm — RS256/HS256 + alg:none — 2026-05-16
- Найдено: JWT использует HS256 (симметричный) через `secret`, алгоритм не указан явно. В `auth.module.ts` и `jwt.strategy.ts` хардкодные дефолтные секреты (`'default-secret'`, `'default-refresh-secret'`). Алгоритм не ограничен — возможна атака algorithm confusion (alg:none).
- Исправлено: Добавлен `signOptions: { algorithm: 'HS256' }` в JwtModule; добавлен `algorithms: ['HS256']` в JwtStrategy; убраны хардкодные дефолтные секреты (замена на runtime-ошибку если не заданы).
- Статус: ✅

## Шаг 1.2: Refresh Token Rotation — 2026-05-16
- Найдено: При refresh старый refresh токен НЕ инвалидируется — можно использовать повторно. `generateTokens()` создаёт новую сессию, но старая не удаляется.
- Исправлено: В `refresh()` перед созданием новых токенов удаляется предыдущая сессия пользователя (`session.deleteMany`), реализуя rotation.
- Статус: ✅

## Шаг 1.3: Password Hash — bcrypt rounds — 2026-05-16
- Найдено: `bcrypt.hash(dto.password, 12)` — rounds = 12.
- Исправлено: ✅ Уже настроено (≥ 12).
- Статус: ✅

## Шаг 1.4: Rate Limiting на /auth/login — 2026-05-16
- Найдено: ThrottlerModule есть глобально, но нет специфических лимитов для auth endpoint. API spec требует 10 req/min для Auth.
- Исправлено: Добавлены `@SkipThrottle()` и `@Throttle()` декораторы; настроены auth-specific лимиты в ThrottlerModule.
- Статус: ✅

## Шаг 1.5: Account Lockout — 2026-05-16
- Найдено: Account lockout отсутствует.
- Исправлено: Пропущено (будущий шаг).
- Статус: 🔄

## Шаг 1.6: Registration Validation — 2026-05-16
- Найдено: phone — без валидации формата (`.optional()`); password — только min 8, нет требований сложности.
- Исправлено: В `register.dto.ts` добавлена валидация phone (regex), password complexity (uppercase + lowercase + digit + min 8).
- Статус: ✅

## Шаг 1.7: Logout — Session Revocation — 2026-05-16
- Найдено: `logout()` делает `session.deleteMany({ userId })` — сессии ревокурятся.
- Исправлено: ✅ Уже настроено.
- Статус: ✅

## Шаг 1.8: Password Reset Token — Expiry — 2026-05-16
- Найдено: `expiresAt` = 1 час (3600000ms). Должно быть 15 минут.
- Исправлено: Изменено на 15 минут (900000ms).
- Статус: ✅

## Шаг 2.1: JwtAuthGuard — проверка expiry, signature — 2026-05-16
- Найдено: JwtAuthGuard использует passport-jwt с `ignoreExpiration: false` и `algorithms: ['HS256']`. Валидация пользователя в БД (status !== 'active').
- Исправлено: ✅ Уже настроено. Добавлено явное указание `algorithms: ['HS256']`.
- Статус: ✅

## Шаг 2.2: RolesGuard — сравнение role — 2026-05-16
- Найдено: RolesGuard корректно сравнивает `user.role` с requiredRoles из декоратора `@Roles()`.
- Исправлено: ✅ Уже настроено.
- Статус: ✅

## Шаг 2.3: BOLA — journalist может редактировать только свою новость — 2026-05-16
- Найдено: В `news.service.ts.update()` проверка `article.authorId !== userId && userRole === 'journalist'`. Журналист не может редактировать чужие новости. Editor+ могут редактировать любые.
- Исправлено: ✅ Уже настроено.
- Статус: ✅

## Шаг 3: Security Headers — 2026-05-16
- Найдено: CSP был отключён (`contentSecurityPolicy: false`). HSTS, X-Frame-Options, X-Content-Type-Options не были явно настроены (helmet умолчания).
- Исправлено: Настроен полный CSP, HSTS (maxAge=31536000, includeSubDomains, preload), X-Frame-Options: deny, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin.
- Статус: ✅

## Шаг 4: Rate Limiting — 2026-05-16
- Найдено: ThrottlerModule был глобально, но без специфических лимитов для auth endpoint (register/login/recover/reset-password). API spec требует 10 req/min для Auth.
- Исправлено: Добавлены `@Throttle()` декораторы на auth endpoints: login (10/min), register (5/min), recover (3/min), reset-password (5/min).
- Статус: ✅

## Шаг 5.1: register.dto.ts — валидация — 2026-05-16
- Найдено: phone — без валидации формата (`.optional()`); password — только min 8, без требований сложности.
- Исправлено: Добавлена regex валидация phone; password теперь требует uppercase + lowercase + digit.
- Статус: ✅

## Шаг 5.2: login.dto.ts — валидация — 2026-05-16
- Найдено: email — `z.string().email()`, password — `z.string().min(1)`.
- Исправлено: ✅ Уже настроено.
- Статус: ✅

## Шаг 5.3: create-news.dto.ts — валидация — 2026-05-16
- Найдено: Полностью отсутствовала Zod-схема. Поля title, content, slug, sourceUrl, mainImageUrl, seoOgImage не валидировались.
- Исправлено: Добавлен `CreateNewsSchema` с валидацией title (min:3, max:255), content (min:10), slug (regex), sourceUrl (url), categoryId (uuid) и т.д. Добавлен `@UsePipes(new ZodValidationPipe(CreateNewsSchema))` в контроллер.
- Статус: ✅

## Шаг 5.4: update-news.dto.ts — валидация — 2026-05-16
- Найдено: Полностью отсутствовала Zod-схема.
- Исправлено: Добавлен `UpdateNewsSchema` с валидацией всех опциональных полей. Добавлен `@UsePipes` в контроллер.
- Статус: ✅
