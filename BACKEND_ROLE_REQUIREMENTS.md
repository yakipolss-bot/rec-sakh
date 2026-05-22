# Требования к бэкенду: Проверка ролей при авторизации

## 📌 Обзор

Фронтенд система полностью готова к проверке ролей. **Бэкенд ДОЛЖЕН:**

1. ✅ Возвращать правильную роль при получении профиля пользователя (`GET /users/me`)
2. ✅ Проверять роль пользователя при доступе к защищённым endpoint-ам
3. ✅ Гарантировать, что роль не может быть подделана клиентом

---

## 🔌 Критические API Endpoints

### 1. GET /users/me (ОБЯЗАТЕЛЕН для работы)

**Назначение:** Получить полный профиль текущего пользователя включая его РОЛЬ из БД

**Требования:**
- Защищён: Bearer token в header Authorization
- Проверить: JWT token действителен
- Получить: user.id из токена
- Запросить БД: найти пользователя по ID
- Вернуть: полный профиль с РОЛЬЮ

**Request:**
```http
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "email": "editor@sakhcom.ru",
    "name": "Иван Петров",
    "role": "editor",                    // ← КРИТИЧНО!
    "avatarUrl": "https://...",
    "city": "Южно-Сахалинск",
    "karma": 125,
    "level": "gold",
    "registeredAt": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "commentsCount": 42,
    "adsCount": 15,
    "subscriptions": ["politics", "sports"]
  }
}
```

**Возможные ответы:**
- `200 OK` - Пользователь найден, роль возвращена
- `401 Unauthorized` - Нет токена или токен невалиден
- `404 Not Found` - Пользователь не найден в БД (редкий случай)
- `500 Internal Server Error` - Ошибка сервера

**Пример некорректного ответа (БЕЗ роли):**
```json
// ❌ НЕПРАВИЛЬНО - Отсутствует "role"
{
  "data": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "email": "editor@sakhcom.ru",
    "name": "Иван Петров",
    // role отсутствует!
  }
}
```

---

### 2. POST /auth/login (Подтверждение)

**Текущее состояние:** Фронтенд вызывает GET /users/me ПОСЛЕ успешной авторизации

**Требования на бэкенде для login endpoint:**
- Проверить email + password против Supabase
- Если OK → Вернуть access_token и refresh_token
- ⚠️ ВАЖНО: Роль можно вернуть, но фронтенд всё равно вызовет GET /users/me для получения актуальной роли

---

## 🗄️ Структура БД

### Таблица: users

```sql
CREATE TABLE users (
  -- Основные поля
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- ⭐ РОЛЬ - самое важное!
  role VARCHAR(50) NOT NULL DEFAULT 'user',
    -- Возможные значения:
    -- 'user' - обычный пользователь
    -- 'moderator' - модератор (может удалять комментарии)
    -- 'editor' - редактор (может создавать/редактировать новости)
    -- 'chief_editor' - главный редактор (может управлять редакцией)
    -- 'admin' - администратор (полный доступ)
    -- 'superadmin' - супер-администратор (может управлять админами)
  
  -- Профиль
  phone VARCHAR(20),
  city VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  
  -- Статистика
  karma INT DEFAULT 0,
  level VARCHAR(50) DEFAULT 'bronze',
  comments_count INT DEFAULT 0,
  ads_count INT DEFAULT 0,
  
  -- Временные метки
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_login_at TIMESTAMP
);

-- ИНДЕКСЫ
CREATE INDEX idx_users_id ON users(id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Таблица: user_roles (опционально - для более гибкого управления)

```sql
-- Если нужна более сложная система ролей
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT now(),
  granted_by UUID REFERENCES users(id),
  reason TEXT
);

CREATE INDEX idx_user_roles_role ON user_roles(role);
```

---

## 🔐 Реализация Middleware для проверки ролей

### Пример на Express.js + NestJS

**Express middleware:**
```typescript
// middleware/roleCheck.ts
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'No token' });

      // Декодировать JWT
      const decoded = jwt.verify(token, SECRET_KEY);
      const userId = (decoded as any).sub;

      // Получить пользователя из БД
      const user = await db.users.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Проверить роль
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          actual: user.role
        });
      }

      // Сохранить пользователя в контексте
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// Использование
app.get('/admin/users', 
  requireRole('admin', 'superadmin'),
  async (req, res) => {
    // Только администраторы и супер-администраторы
  }
);

app.get('/editorial/news',
  requireRole('editor', 'chief_editor', 'admin', 'superadmin'),
  async (req, res) => {
    // Только редакторы и администраторы
  }
);
```

**NestJS Guard:**
```typescript
// guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('User not authenticated');
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `User role '${user.role}' is not authorized. Required: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}

// Использование
@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin', 'superadmin')
export class AdminController {
  @Get('users')
  getUsers() { /* ... */ }
}
```

---

## ✅ Проверочный список для бэкенда

### API Endpoints
- [ ] GET /users/me возвращает роль из БД
- [ ] GET /users/me проверяет JWT токен
- [ ] Роль извлекается по user.id (не по email или другому полю)
- [ ] Возвращаемая роль совпадает с one of: user, moderator, editor, chief_editor, admin, superadmin

### Проверка ролей
- [ ] GET /editorial/* требует роль editor|chief_editor|admin|superadmin
- [ ] GET /admin/* требует роль admin|superadmin
- [ ] Возвращается 403 Forbidden если роль недостаточна
- [ ] Возвращается 401 Unauthorized если токен невалиден

### Безопасность
- [ ] Роль не может быть изменена клиентом
- [ ] Невозможно получить/изменить роль другого пользователя
- [ ] Логирование попыток неавторизованного доступа
- [ ] Rate limiting на API endpoints

### БД
- [ ] Все пользователи имеют роль в таблице users
- [ ] Нет пользователей с NULL ролью (fallback на 'user')
- [ ] Индексы созданы на (id) и (role) для производительности

---

## 🧪 Тестирование

### Скрипт для проверки ролей

```bash
#!/bin/bash

API_URL="http://localhost:4000/api/v1"

# 1. Логиниться как редактор
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@example.com","password":"password"}' \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"

# 2. Получить профиль
curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.role'

# Ожидается: "editor"

# 3. Попытка доступа к админ endpoint
curl -s -X GET "$API_URL/admin/users" \
  -H "Authorization: Bearer $TOKEN"

# Ожидается: { "error": "Insufficient permissions" }
```

---

## 📊 Диаграмма потока

```
┌─────────────────────────────────────────────────────────────┐
│                    ФРОНТЕНД ПРИЛОЖЕНИЕ                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
                 authService.login()
                          ↓
            Supabase.auth.signInWithPassword()
                          ↓
        ✓ Получены accessToken и refreshToken
                          ↓
              apiClient GET /users/me
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    БЭКЕНД API СЕРВЕР                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Проверить JWT токен                                      │
│ 2. Извлечь user.id из JWT                                  │
│ 3. SELECT * FROM users WHERE id = ?                        │
│ 4. Вернуть user + ROLE из БД                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
        Response: { user: { id, role: 'editor' } }
                          ↓
         AuthContext.user.role = 'editor'
                          ↓
        ProtectedRoute проверяет роль
                          ↓
    ✓ Редирект на /editorial ✓
```

---

## 🎯 Заключение

**Фронтенд:** ✅ **ГОТОВ** - ждёт от бэкенда получить роль из БД

**Бэкенд:** 🔄 **В ПРОЦЕССЕ** - нужна реализация:
1. GET /users/me должен возвращать роль из таблицы users
2. Роль должна проверяться на основе user.id (из JWT)
3. Защищённые endpoint-ы должны проверять роль и возвращать 403 если недостаточно

**После реализации:** Вся система авторизации и проверки ролей будет работать корректно ✅

---

**Документ создан:** 22 мая 2026  
**Версия:** 1.0  
**Автор:** Система верификации фронтенда
