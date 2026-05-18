# Sakhcom — Техническая спецификация

## Зависимости

```
dependencies:
  - react-router-dom          # Маршрутизация (6 страниц)
  - framer-motion             # Анимации, page transitions, hover effects
  - lucide-react              # Иконки (все UI-иконки)
  - date-fns                  # Форматирование дат (ru locale)
  - @fontsource/inter          # Основной шрифт
  - @fontsource/fraunces       # Заголовочный шрифт
  - @fontsource/jetbrains-mono # Моноширинный шрифт

devDependencies:
  - tailwindcss               # Уже в проекте
```

## Компоненты

### Layout (общие)
| Компонент | Описание | Примечание |
|-----------|----------|------------|
| Navbar | Фиксированная навигация с логотипом, разделами, поиском, темой, профилем | backdrop-blur, 64px height |
| Footer | Нижний колонтитул с ссылками, копирайтом | |
| ScrollProgress | Индикатор прогресса скролла сверху | 2px #00E5CC |
| NoiseOverlay | SVG noise текстура на весь экран | 3% opacity, pointer-events-none |
| ThemeSwitcher | Выпадающее меню 5 тем | localStorage persistence |
| SearchOverlay | Модальное окно поиска с автокомплитом | framer-motion AnimatePresence |

### UI компоненты
| Компонент | Описание | Использование |
|-----------|----------|---------------|
| NewsCard | Карточка новости: img, tag, title, meta | Home, Category, Search |
| ResultCard | Карточка результата поиска с hover-эффектами | Search |
| HeroCard | Крупная карточка для hero-секции | Home |
| WeatherWidget | Виджет погоды с иконкой и температурой | Home |
| CurrencyWidget | Мини-виджет курсов валют | Home |
| EventPill | Мини-карточка события (афиша) | Home |
| Comment | Компонент комментария с вложенностью | Article |
| FilterPill | Пилл-фильтр для ленты/поиска | Category, Search |
| Tab | Таб для навигации в кабинете | Account |
| Button | Brutalist кнопка (0px radius) | Везде |
| SearchBar | Поле поиска с иконкой и автокомплитом | SearchOverlay, SearchPage |
| EmptyState | Zero results / пустое состояние | Search, Account |

### Страницы (Pages)
| Страница | Компоненты | Особенности |
|----------|-----------|-------------|
| HomePage | HeroSection, BentoGrid, WeatherWidget, CurrencyWidget, EventsStrip, ThemeDay | 6 секций |
| ArticlePage | ArticleHeader, ArticleBody, CommentsSection, RelatedNews | Typewriter reveal |
| CategoryPage | CategoryHeader, FilterBar, NewsGrid, Pagination | Фильтры по дате/популярности |
| SearchPage | SearchBar, FilterSidebar, ResultsList, EmptyState | Автокомплит, фасеты |
| AccountPage | ProfileHeader, Tabs (Profile/Comments/Favorites/Settings) | Таб-навигация |
| AuthPage | LoginForm, RegisterForm | Переключение форм |

## Анимации

| Анимация | Библиотека | Реализация | Сложность |
|----------|-----------|------------|-----------|
| Noise overlay на hover карточек | CSS | ::after с SVG background, opacity transition | Low |
| Typewriter text reveal | framer-motion | Посимвольное stagger через motion.span | High |
| Page transitions | framer-motion | AnimatePresence + motion.div | Medium |
| Search overlay open/close | framer-motion | AnimatePresence, slide + fade | Medium |
| Card hover (translateX + border) | CSS + framer-motion | whileHover={{ x: 2 }}, border-color | Low |
| Scroll progress bar | CSS + JS | scaleX от scroll progress | Low |
| Theme cross-fade | CSS | transition на все цветовые свойства 0.4s | Low |
| Link underline grow | CSS | scaleX(0→1), transform-origin: left | Low |
| Comment expand/collapse | framer-motion | AnimatePresence, height auto | Medium |
| Autocomplete dropdown | framer-motion | AnimatePresence, slide down | Low |

## State & Logic

### Маршрутизация (React Router v6)
```
/                    → HomePage
/news/:id            → ArticlePage
/category/:slug      → CategoryPage
/search?q=...        → SearchPage
/account             → AccountPage
/login               → AuthPage
```

### Темы (Context + localStorage)
- 5 режимов: morning, day, evening, focus, night
- CSS custom properties для всех цветов
- Переключение через data-theme attribute на html
- Авто-режим по времени (UTC+11 Сахалин)

### Поиск (local state)
- Debounce 120ms на ввод
- Автокомплит: фильтрация mock-данных
- Фильтры по рубрике, городу, дате, типу
- URL-параметры для shareable search

### Избранное (localStorage)
- Массив ID новостей
- CRUD через context
- Тост-уведомления

## Мок-данные

### Новости (20 items)
- Реалистичные заголовки на тему Сахалина
- Категории: Общество, Происшествия, Экономика, Спорт, Культура, Транспорт, ЖКХ, Природа
- Города: Южно-Сахалинск, Корсаков, Холмск, Оха, Невельск
- Метаданные: дата, просмотры, комментарии, автор
- Иерархические комментарии (3 уровня)

### Погода (5 городов)
- Текущая температура, ощущается, влажность, ветер
- SVG-иконки: солнце, облака, дождь, снег, гроза

### Курсы валют
- USD, JPY, KRW, CNY — курс ЦБ РФ

### Афиша (5 событий)
- Название, дата, место, категория (кино, театр, концерт, выставка, спорт)
