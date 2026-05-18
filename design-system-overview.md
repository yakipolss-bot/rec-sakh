# Дизайн-система «Точка слияния» (Convergence Point)

## Принципы

Дизайн-система **«Точка слияния»** — визуальный синтез бруталистской архитектуры и сахалинской природы (океан, закат, туман, скалы).

- **Brutalism × Nature**: жёсткие линии, нулевые скругления, сырые текстуры — смягчённые природными акцентами (бирюза океана, оранж заката)
- **Контраст как инструмент**: 4.5:1 для текста, 3:1 для крупных элементов (WCAG AA)
- **Функциональная эстетика**: каждый визуальный элемент имеет назначение
- **5 настроений (тем)**: morning, day, evening, focus, night — отражают цикл сахалинского дня

## Цветовая палитра

### Акцентные цвета
| Токен | Значение | Назначение |
|-------|----------|------------|
| `--accent-ocean` | `#00E5CC` | Основной акцент (океан/бирюза) |
| `--accent-sunset` | `#FF6B35` | Вторичный акцент (закат/оранж) |

### Расширенные палитры
- `--accent-ocean-50` → `--accent-ocean-900` (10 ступеней)
- `--accent-sunset-50` → `--accent-sunset-900` (10 ступеней)
- `--neutral-50` → `--neutral-900` (нейтральная шкала)
- `--surface-50` → `--surface-900` (поверхностная шкала)

### Тематические переменные (переопределяются через `data-theme`)
- `--bg-primary`, `--bg-secondary`, `--bg-surface`, `--bg-elevated`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--border-color`, `--border-subtle`
- `--shadow-*` (sm, md, lg, xl, glow)
- `--noise-opacity`, `--noise-density`

## Типографическая шкала

| Класс | Размер | Шрифт | Назначение |
|-------|--------|-------|------------|
| `.sakh-display` | `clamp(2.5rem, 5vw, 4.5rem)` | Fraunces | Гигантские заголовки |
| `.sakh-heading` | `clamp(1.5rem, 3vw, 2.25rem)` | Inter | Заголовки секций |
| `.sakh-title` | `clamp(1.125rem, 2vw, 1.5rem)` | Inter | Заголовки карточек |
| `.sakh-body` | `1rem` | Inter | Основной текст |
| `.sakh-caption` | `0.75rem` | JetBrains Mono | Капшн/подписи |
| `.sakh-meta` | `0.75rem` | JetBrains Mono | Мета-информация |

## Темы

| Тема | `data-theme` | Характер |
|------|-------------|----------|
| Morning | `morning` | Светлая, мягкие скругления, тёплые тона |
| Day | `day` | Средняя контрастность, нейтральная |
| Evening | `evening` | Тёмная, тёплая (закатные тона) |
| Focus | `focus` | Монохромная, минималистичная |
| Night | `night` | True black (AMOLED), минимальное освещение |

Темы переключаются через `data-theme` на `<html>`. Авто-режим определяет тему по UTC+11 (Сахалин).

## Доступные компоненты

### Новые компоненты (Phase 1)
| Компонент | Файл | Описание |
|-----------|------|----------|
| `BentoGrid` | `components/BentoGrid.tsx` | Адаптивная сетка 2/3+1/3 для HomePage |
| `SearchBar` | `components/SearchBar.tsx` | Поле поиска с иконкой и кнопкой очистки |
| `FilterBar` | `components/FilterBar.tsx` | Горизонтальный скролл фильтров |
| `EmptyState` | `components/EmptyState.tsx` | Пустое состояние с иконкой и CTA |
| `Pagination` | `components/Pagination.tsx` | Бруталистская пагинация |
| `ThemeSwitcher` | `components/ThemeSwitcher.tsx` | Переключатель 5 тем |

### Существующие компоненты (обновлены)
| Компонент | Файл | Изменения |
|-----------|------|-----------|
| `NewsCard` | `components/NewsCard.tsx` | Использует `.sakh-tag`, `.sakh-title`, `.sakh-meta` |
| `WeatherWidget` | `components/WeatherWidget.tsx` | Использует `.sakh-select`, `.sakh-caption`, `.sakh-meta` |
| `CurrencyWidget` | `components/CurrencyWidget.tsx` | Использует `.sakh-tag`, `.sakh-caption`, `.sakh-meta` |
| `EventsWidget` | `components/EventsWidget.tsx` | Использует `.sakh-tag`, `.sakh-caption`, `.sakh-meta` |
| `Navbar` | `components/Navbar.tsx` | Использует `ThemeSwitcher`, inline-стили → токены |

### CSS-компоненты (в `design-system.css`)
- `.sakh-card`, `.sakh-card--hero`, `--compact`, `--horizontal`, `--urgent`
- `.sakh-btn`, `.sakh-btn--primary`, `--secondary`, `--ghost`, `--danger` (sm/md/lg, loading)
- `.sakh-input`, `.sakh-textarea`, `.sakh-select`, `.sakh-checkbox`, `.sakh-radio`
- `.sakh-tag`, `.sakh-tag--accent`, `--sunset`, `--outline`, `--muted`
- `.sakh-meta`, `.sakh-meta--secondary`, `--accent`, `--with-icon`
- `.sakh-search`, `.sakh-search__input`, `__icon`, `__clear`
- `.sakh-filter-bar`, `.sakh-filter-bar__item`, `--active`
- `.sakh-pagination`, `.sakh-pagination__item`, `--active`, `--disabled`
- `.sakh-tabs`, `.sakh-tabs__item`, `--active`
- `.sakh-skeleton` (text, heading, image, avatar, button)
- `.sakh-toast`, `--success`, `--error`
- `.sakh-empty`, `__icon`, `__title`, `__description`
- `.sakh-modal-overlay`, `.sakh-modal`, `__header`, `__title`, `__body`, `__footer`
- `.sakh-progress`, `.sakh-progress__bar`, `--scroll`

### Анимации
- **CSS keyframes**: `fadeIn`, `slideUp`, `slideDown`, `scaleIn`, `shimmer`, `spin`, `pulse`
- **Utility классы**: `.animate-fade-in`, `.animate-slide-up`, `.animate-scale-in`, `.animate-shimmer`, `.animate-spin`, `.animate-pulse`
- **Motion токены**: `--motion-fast`, `--motion-default`, `--motion-slow`, `--motion-spring`
- **Prefers-reduced-motion**: все анимации отключаются через `@media (prefers-reduced-motion: reduce)`

### Текстуры
- `.sakh-noise` — SVG noise overlay (opacity per-theme)
- `.sakh-grain` — grain texture для карточек
- `.sakh-scanline` — scanline для data-theme="focus"
- `.sakh-worn` — worn edges border texture

### Responsive утилиты
- `.sm-only`, `.md-only`, `.lg-only` — display по брейкпоинтам
- `.hide-mobile`, `.hide-desktop` — скрытие по устройству
- Container queries через `@container`

## Инструкция по использованию

### Подключение
```css
@import './styles/design-system.css';
```

### Использование классов
```tsx
<div className="sakh-card">
  <h2 className="sakh-heading">Заголовок</h2>
  <p className="sakh-body">Текст</p>
  <span className="sakh-meta">12 мая 2026</span>
  <button className="sakh-btn sakh-btn--primary">Читать</button>
</div>
```

### Переключение тем
```tsx
// Через хук
const { theme, setTheme, effectiveTheme } = useTheme();
setTheme('night'); // 'morning' | 'day' | 'evening' | 'focus' | 'night' | 'auto'

// Напрямую
document.documentElement.setAttribute('data-theme', 'morning');
```

### Spacing
Используйте CSS-переменные `--space-*` (1 = 0.25rem, 16 = 4rem):
```css
padding: var(--space-4);    /* 1rem */
gap: var(--space-3);        /* 0.75rem */
margin-top: var(--space-8); /* 2rem */
```
