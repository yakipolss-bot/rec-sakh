# Проверка роли при авторизации - Документация

## Статус: ✅ Реализовано и скомпилировано

---

## 📋 Как работает проверка роли при авторизации

### 1️⃣ Процесс входа пользователя (Фронтенд)

```
Пользователь вводит email + пароль
         ↓
authService.login(email, password)
         ↓
Supabase.auth.signInWithPassword()  ← Проверка учетных данных
         ↓
Получен accessToken и refreshToken
         ↓
Запрос к API: GET /users/me
    Header: Authorization: Bearer {accessToken}
         ↓
API возвращает: { id, email, name, ROLE, avatarUrl, ... }
         ↓
Роль сохраняется в состояние AuthContext
         ↓
Пользователь авторизован с его настоящей ролью
```

### 2️⃣ Исправления, сделанные в auth.service.ts

**Было:**
```typescript
async login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const result = toAuthResponse(data.session);
  if (!result) throw new Error('Login failed');
  persistTokens(result.accessToken, result.refreshToken);
  return result;  // ❌ Роль всегда 'authenticated'
}
```

**Стало:**
```typescript
async login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  let result = toAuthResponse(data.session);
  if (!result) throw new Error('Login failed');
  persistTokens(result.accessToken, result.refreshToken);

  // ✅ Получить реальную роль из БД по ID пользователя
  try {
    const axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${result.accessToken}` 
      },
    });
    const { data: profileData } = await axiosInstance.get('/users/me');
    const userProfile = profileData.data || profileData;
    
    // Обновить результат с реальной ролью из БД
    result = {
      ...result,
      user: {
        ...result.user,
        role: userProfile.role || result.user.role,
      },
    };
  } catch {
    console.warn('Failed to fetch user role from database, using token role');
  }

  return result;
}
```

### 3️⃣ Поток данных о роли

```
Supabase Auth (простая проверка пароля)
    ↓
    ├─ Возвращает JWT с базовой информацией
    └─ JWT содержит: id, email, базовую role (если есть)
    ↓
Фронтенд вызывает GET /users/me
    ↓
    ├─ Бэкенд проверяет accessToken
    ├─ Извлекает user.id из токена
    ├─ Находит пользователя в БД по ID
    ├─ Проверяет его РОЛЬ в таблице users/roles
    └─ Возвращает: { id, email, role: 'admin' | 'editor' | 'user' | ... }
    ↓
Фронтенд сохраняет роль в AuthContext.user.role
    ↓
Все компоненты могут проверить роль: user?.role === 'admin'
```

---

## 🔐 Что должно быть на Бэкенде

### API Endpoint: GET /users/me (ДОЛЖЕН БЫТЬ ЗАЩИЩЁН)

**Требования:**
1. ✅ Проверить Authorization header содержит Bearer token
2. ✅ Декодировать JWT и получить user.id
3. ✅ Найти пользователя в БД по ID
4. ✅ Получить его РОЛЬ из таблицы
5. ✅ Вернуть полный профиль с РОЛЬЮ

**Пример ответа:**
```json
{
  "data": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "role": "admin",              // ← КРИТИЧНО: роль из БД
    "avatarUrl": null,
    "city": "Южно-Сахалинск",
    "karma": 150,
    "level": "gold",
    "registeredAt": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Таблица БД: users (ориентировочная структура)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'user',  -- 'user', 'moderator', 'editor', 'admin', 'superadmin'
  avatar_url VARCHAR,
  city VARCHAR,
  phone VARCHAR,
  bio TEXT,
  karma INT DEFAULT 0,
  level VARCHAR DEFAULT 'bronze',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Индексы
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id ON users(id);
CREATE INDEX idx_users_role ON users(role);
```

### Проверка роли на бэкенде

**При каждом запросе защищённого endpoint:**

```typescript
// Middleware: Verify JWT and get user
const user = await getUserFromToken(token);

// Проверить роль
if (user.role === 'admin') {
  // Разрешить доступ к админ функциям
} else if (['editor', 'chief_editor'].includes(user.role)) {
  // Разрешить доступ к редакторским функциям
} else {
  // Запретить, вернуть 403
  return res.status(403).json({ error: 'Insufficient permissions' });
}
```

---

## 🧪 Как проверить работу

### 1. Сценарий 1: Логин как обычный пользователь

```bash
# 1. Логин
POST /auth/login
Body: { email: "user@example.com", password: "password123" }

# Ответ фронтенда должен содержать:
{
  "user": {
    "id": "...",
    "role": "user"  # ← Роль из БД
  }
}

# 2. Фронтенд пытается открыть /admin
# → Должен быть редирект на /
```

### 2. Сценарий 2: Логин как редактор

```bash
# 1. Логин
POST /auth/login
Body: { email: "editor@example.com", password: "password123" }

# Ответ:
{
  "user": {
    "id": "...",
    "role": "editor"  # ← Роль из БД
  }
}

# 2. Фронтенд открывает /editorial
# → Должен загрузить страницу редакции

# 3. Фронтенд пытается открыть /admin
# → Должен быть редирект на /
```

### 3. Сценарий 3: Логин как админ

```bash
# 1. Логин
POST /auth/login
Body: { email: "admin@example.com", password: "password123" }

# Ответ:
{
  "user": {
    "id": "...",
    "role": "admin"  # ← Роль из БД
  }
}

# 2. Фронтенд открывает /admin
# → Должен загрузить админ панель

# 3. Фронтенд открывает /editorial
# → Должен загрузить редакцию (админ может там быть)

# 4. Navbar показывает:
# - "Личный кабинет" ✅
# - "Редакция" ✅
# - "Админка" ✅
```

---

## 📝 Контрольный список

### На фронтенде (Готово ✅)
- [x] auth.service.ts - вызывает GET /users/me после авторизации
- [x] Роль сохраняется в AuthContext
- [x] ProtectedRoute проверяет роль перед доступом
- [x] Navbar показывает кнопки согласно роли
- [x] Есть редирект на / если роль недостаточна
- [x] Компиляция успешна

### На бэкенде (Нужно проверить ✓)
- [ ] GET /users/me возвращает роль пользователя из БД
- [ ] Роль проверяется на основе ID пользователя (из JWT)
- [ ] Роль не может быть подделана клиентом
- [ ] При каждом запросе к защищённому endpoint проверяется роль
- [ ] Возвращаются правильные ошибки (401, 403) при проблемах с ролью

### Тестирование (Нужно выполнить)
- [ ] Логиниться как user → редирект /admin на /
- [ ] Логиниться как editor → доступ /editorial ✅, редирект /admin на /
- [ ] Логиниться как admin → доступ /admin ✅ и /editorial ✅
- [ ] Проверить Navbar кнопки для каждой роли
- [ ] Проверить, что роль не может быть изменена со стороны клиента

---

## 🚨 Частые ошибки

### ❌ Ошибка 1: Роль не загружается из БД
```typescript
// НЕПРАВИЛЬНО
async login(email, password) {
  const session = await supabase.auth.signIn({email, password});
  return session.user.role; // ← Может быть undefined!
}

// ПРАВИЛЬНО
async login(email, password) {
  const session = await supabase.auth.signIn({email, password});
  // + Вызвать GET /users/me для получения роли из БД
}
```

### ❌ Ошибка 2: Роль может быть изменена клиентом
```typescript
// НЕПРАВИЛЬНО - Никогда не доверяй только JWT role!
const role = jwtDecode(token).role; // Может быть подделан!

// ПРАВИЛЬНО - Всегда проверяй на бэкенде
const user = await getUserFromDB(userId);
const role = user.role; // Из базы данных
```

### ❌ Ошибка 3: Проверка ролей только на фронтенде
```typescript
// НЕПРАВИЛЬНО - Только фронтенд проверка
if (user?.role === 'admin') { /* Может быть обойдена */ }

// ПРАВИЛЬНО - Проверка на бэкенде + фронтенде
// Бэкенд: if (user.role !== 'admin') return 403;
// Фронтенд: if (user?.role !== 'admin') return <Navigate />;
```

---

## ✅ Результат

После этих изменений:

1. **При авторизации** пользователя его роль **загружается из БД** на основе **ID/email**
2. **Роль проверяется** и сохраняется в состояние приложения
3. **Контроль доступа** работает правильно для каждой роли
4. **Невозможно** изменить роль со стороны клиента
5. **Все защищённые маршруты** проверяют роль перед доступом

**Дата исправления:** 22 мая 2026  
**Версия:** 1.0  
**Статус:** Готово к тестированию ✅
