# Database Schema — Sakhcom Portal

**Database**: PostgreSQL 16 + TimescaleDB 2.x  
**Extensions**: `uuid-ossp`, `pgcrypto`, `timescaledb`  
**Naming**: `snake_case`, plural for tables, singular for columns  
**PK**: UUID v4 via `gen_random_uuid()`  
**Timestamps**: `TIMESTAMPTZ` with `DEFAULT NOW()`  
**Soft delete**: `deleted_at TIMESTAMPTZ DEFAULT NULL`

---

## 1. ENUM Types

```sql
-- ============================================================
-- USER & AUTH
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'guest', 'user', 'journalist', 'proofreader', 'editor',
  'chief_editor', 'moderator', 'admin', 'superadmin'
);

CREATE TYPE user_status AS ENUM (
  'active', 'blocked', 'deleted'
);

CREATE TYPE oauth_provider AS ENUM (
  'telegram', 'vk', 'yandex'
);

-- ============================================================
-- CONTENT
-- ============================================================
CREATE TYPE news_status AS ENUM (
  'draft', 'review', 'published', 'rejected', 'archived'
);

CREATE TYPE comment_status AS ENUM (
  'pending', 'approved', 'rejected', 'deleted'
);

CREATE TYPE event_status AS ENUM (
  'draft', 'published', 'cancelled', 'completed', 'archived'
);

CREATE TYPE ad_status AS ENUM (
  'active', 'pending', 'rejected', 'archived'
);

CREATE TYPE job_type AS ENUM (
  'vacancy', 'resume'
);

CREATE TYPE realty_type AS ENUM (
  'sale', 'rent', 'newbuild', 'commercial'
);

CREATE TYPE content_type AS ENUM (
  'news', 'events', 'ads', 'directory'
);

CREATE TYPE directory_status AS ENUM (
  'active', 'pending', 'rejected', 'archived'
);

-- ============================================================
-- MODERATION
-- ============================================================
CREATE TYPE moderation_status AS ENUM (
  'pending', 'approved', 'rejected'
);

CREATE TYPE report_reason AS ENUM (
  'spam', 'abuse', 'offtopic', 'harassment', 'misinformation', 'other'
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TYPE notification_type AS ENUM (
  'comment_reply', 'comment_vote', 'news_breaking', 'news_urgent',
  'event_reminder', 'ad_status', 'job_response', 'moderation_result',
  'newsletter', 'billing', 'system'
);

-- ============================================================
-- BILLING
-- ============================================================
CREATE TYPE payment_method AS ENUM (
  'card', 'sbp', 'crypto', 'yookassa'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'succeeded', 'failed', 'refunded', 'cancelled'
);

CREATE TYPE tariff_interval AS ENUM (
  'month', 'quarter', 'year'
);

CREATE TYPE transaction_type AS ENUM (
  'payment', 'refund', 'subscription', 'promotion'
);

-- ============================================================
-- ADVERTISING
-- ============================================================
CREATE TYPE promote_level AS ENUM (
  'raise', 'highlight', 'urgent', 'vip'
);

CREATE TYPE newsletter_status AS ENUM (
  'draft', 'scheduled', 'sending', 'sent', 'failed'
);

CREATE TYPE channel_type AS ENUM (
  'email', 'push', 'sms', 'telegram'
);
```

---

## 2. Full Table Schema (DDL)

### 2.1 Auth & Users

```sql
-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  phone           TEXT,
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'user',
  status          user_status NOT NULL DEFAULT 'active',
  name            TEXT NOT NULL,
  avatar_url      TEXT,
  bio             TEXT,
  karma           INTEGER NOT NULL DEFAULT 0,
  level           INTEGER NOT NULL DEFAULT 1,
  is_phone_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  is_email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret    TEXT,
  two_factor_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_phone UNIQUE (phone),
  CONSTRAINT ck_users_karma CHECK (karma >= 0),
  CONSTRAINT ck_users_level CHECK (level >= 1)
);

-- ============================================================
-- user_settings
-- ============================================================
CREATE TABLE user_settings (
  user_id                 UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme                   TEXT NOT NULL DEFAULT 'system',
  language                TEXT NOT NULL DEFAULT 'ru',
  email_notifications     BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications      BOOLEAN NOT NULL DEFAULT TRUE,
  sms_notifications       BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_show_online     BOOLEAN NOT NULL DEFAULT TRUE,
  privacy_show_ads        BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT ck_user_settings_theme CHECK (theme IN ('light', 'dark', 'system')),
  CONSTRAINT ck_user_settings_language CHECK (language IN ('ru', 'en'))
);

-- ============================================================
-- sessions (Lucia v3 compatible)
-- ============================================================
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- oauth_accounts
-- ============================================================
CREATE TABLE oauth_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider            oauth_provider NOT NULL,
  provider_account_id TEXT NOT NULL,
  provider_data       JSONB NOT NULL DEFAULT '{}',

  CONSTRAINT uq_oauth_provider_account UNIQUE (provider, provider_account_id)
);

-- ============================================================
-- password_reset_tokens
-- ============================================================
CREATE TABLE password_reset_tokens (
  token_hash  TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- verification_tokens
-- ============================================================
CREATE TABLE verification_tokens (
  token_hash  TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,

  CONSTRAINT ck_verification_token_type CHECK (type IN ('email', 'phone', '2fa'))
);
```

### 2.2 News

```sql
-- ============================================================
-- tags
-- ============================================================
CREATE TABLE tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_tags_name UNIQUE (name),
  CONSTRAINT uq_tags_slug UNIQUE (slug)
);

-- ============================================================
-- categories (polymorphic — one table for all sections)
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  type        content_type NOT NULL DEFAULT 'news',

  CONSTRAINT uq_categories_slug UNIQUE (slug)
);

-- ============================================================
-- news_articles
-- ============================================================
CREATE TABLE news_articles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT NOT NULL,
  title                 TEXT NOT NULL,
  lead                  TEXT,
  content               TEXT NOT NULL,
  main_image_url        TEXT,
  main_image_thumbnail  TEXT,
  gallery               JSONB NOT NULL DEFAULT '[]',
  video_url             TEXT,
  video_type            TEXT,
  video_duration        INTEGER,
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  city                  VARCHAR(50),
  status                news_status NOT NULL DEFAULT 'draft',
  is_urgent             BOOLEAN NOT NULL DEFAULT FALSE,
  is_premium            BOOLEAN NOT NULL DEFAULT FALSE,
  is_breaking           BOOLEAN NOT NULL DEFAULT FALSE,
  published_at          TIMESTAMPTZ,
  scheduled_at          TIMESTAMPTZ,
  source_name           TEXT,
  source_url            TEXT,
  seo_title             TEXT,
  seo_description       TEXT,
  seo_og_image          TEXT,
  views_count           INTEGER NOT NULL DEFAULT 0,
  comments_count        INTEGER NOT NULL DEFAULT 0,
  reading_time_minutes  INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT uq_news_articles_slug UNIQUE (slug),
  CONSTRAINT ck_news_reading_time CHECK (reading_time_minutes IS NULL OR reading_time_minutes > 0),
  CONSTRAINT ck_news_views CHECK (views_count >= 0),
  CONSTRAINT ck_news_comments CHECK (comments_count >= 0),
  CONSTRAINT ck_news_video_type CHECK (video_type IS NULL OR video_type IN ('youtube', 'upload'))
);

-- ============================================================
-- news_tags
-- ============================================================
CREATE TABLE news_tags (
  news_id   UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (news_id, tag_id)
);

-- ============================================================
-- news_versions
-- ============================================================
CREATE TABLE news_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id         UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  title           TEXT NOT NULL,
  lead            TEXT,
  content         TEXT NOT NULL,
  changed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  change_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_news_version UNIQUE (news_id, version_number),
  CONSTRAINT ck_news_version_number CHECK (version_number >= 1)
);

-- ============================================================
-- news_related
-- ============================================================
CREATE TABLE news_related (
  news_id_1   UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  news_id_2   UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  score       REAL NOT NULL DEFAULT 0,

  CONSTRAINT pk_news_related PRIMARY KEY (news_id_1, news_id_2),
  CONSTRAINT ck_news_related_score CHECK (score >= 0 AND score <= 1),
  CONSTRAINT ck_news_related_different CHECK (news_id_1 <> news_id_2)
);
```

### 2.3 Comments

```sql
-- ============================================================
-- comments
-- ============================================================
CREATE TABLE comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id         UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  status          comment_status NOT NULL DEFAULT 'pending',
  likes_count     INTEGER NOT NULL DEFAULT 0,
  dislikes_count  INTEGER NOT NULL DEFAULT 0,
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  is_edited       BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT ck_comment_likes CHECK (likes_count >= 0),
  CONSTRAINT ck_comment_dislikes CHECK (dislikes_count >= 0)
);

-- ============================================================
-- comment_votes
-- ============================================================
CREATE TABLE comment_votes (
  comment_id  UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote        SMALLINT NOT NULL DEFAULT 0,

  PRIMARY KEY (comment_id, user_id),
  CONSTRAINT ck_comment_vote_value CHECK (vote IN (-1, 0, 1))
);

-- ============================================================
-- comment_reports
-- ============================================================
CREATE TABLE comment_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id    UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason        report_reason NOT NULL,
  description   TEXT,
  status        moderation_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- comment_blacklist
-- ============================================================
CREATE TABLE comment_blacklist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word        TEXT NOT NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_comment_blacklist_word UNIQUE (word)
);
```

### 2.4 Events (Афиша)

```sql
-- ============================================================
-- events
-- ============================================================
CREATE TABLE events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  short_description   TEXT,
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  organizer_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  city                VARCHAR(50),
  venue_name          TEXT,
  venue_address       TEXT,
  venue_coordinates   POINT,
  start_date          TIMESTAMPTZ NOT NULL,
  end_date            TIMESTAMPTZ,
  is_free             BOOLEAN NOT NULL DEFAULT TRUE,
  price               NUMERIC(10, 2),
  currency            VARCHAR(3) NOT NULL DEFAULT 'RUB',
  image_url           TEXT,
  status              event_status NOT NULL DEFAULT 'draft',
  is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule     TEXT,
  max_participants    INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT ck_event_price CHECK (price IS NULL OR price >= 0),
  CONSTRAINT ck_event_participants CHECK (max_participants IS NULL OR max_participants > 0),
  CONSTRAINT ck_event_dates CHECK (end_date IS NULL OR end_date > start_date)
);

-- ============================================================
-- event_subscriptions
-- ============================================================
CREATE TABLE event_subscriptions (
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (event_id, user_id)
);
```

### 2.5 Ads (Объявления)

```sql
-- ============================================================
-- ads
-- ============================================================
CREATE TABLE ads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city          VARCHAR(50),
  price         NUMERIC(10, 2),
  condition     VARCHAR(20),
  phone         TEXT,
  images        JSONB NOT NULL DEFAULT '[]',
  status        ad_status NOT NULL DEFAULT 'pending',
  views_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,

  CONSTRAINT ck_ads_price CHECK (price IS NULL OR price >= 0),
  CONSTRAINT ck_ads_views CHECK (views_count >= 0),
  CONSTRAINT ck_ads_condition CHECK (condition IS NULL OR condition IN ('new', 'used', 'broken'))
);

-- ============================================================
-- ads_promotions
-- ============================================================
CREATE TABLE ads_promotions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  level       promote_level NOT NULL,
  starts_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at     TIMESTAMPTZ NOT NULL,
  payment_id  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_ads_promotion_dates CHECK (ends_at > starts_at)
);
```

### 2.6 Jobs (Работа)

```sql
-- ============================================================
-- jobs
-- ============================================================
CREATE TABLE jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          job_type NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city          VARCHAR(50),
  salary_min    NUMERIC(10, 2),
  salary_max    NUMERIC(10, 2),
  currency      VARCHAR(3) DEFAULT 'RUB',
  schedule      VARCHAR(50),
  experience    VARCHAR(50),
  company_name  TEXT,
  contacts      JSONB NOT NULL DEFAULT '{}',
  status        ad_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,

  CONSTRAINT ck_jobs_salary_min CHECK (salary_min IS NULL OR salary_min >= 0),
  CONSTRAINT ck_jobs_salary_max CHECK (salary_max IS NULL OR salary_max >= 0),
  CONSTRAINT ck_jobs_salary_range CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

-- ============================================================
-- job_responses
-- ============================================================
CREATE TABLE job_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT,
  resume_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.7 Realty (Недвижимость)

```sql
-- ============================================================
-- realty
-- ============================================================
CREATE TABLE realty (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            realty_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city            VARCHAR(50),
  district        TEXT,
  address         TEXT,
  price           NUMERIC(12, 2),
  currency        VARCHAR(3) DEFAULT 'RUB',
  rooms           INTEGER,
  area_total      NUMERIC(10, 2),
  area_living     NUMERIC(10, 2),
  floor           INTEGER,
  floors_total    INTEGER,
  house_type      TEXT,
  construction_year INTEGER,
  condition       TEXT,
  land_area       NUMERIC(10, 2),
  coordinates     POINT,
  images          JSONB NOT NULL DEFAULT '[]',
  phone           TEXT,
  status          ad_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT ck_realty_price CHECK (price IS NULL OR price >= 0),
  CONSTRAINT ck_realty_rooms CHECK (rooms IS NULL OR rooms > 0),
  CONSTRAINT ck_realty_area_total CHECK (area_total IS NULL OR area_total > 0),
  CONSTRAINT ck_realty_floor CHECK (floor IS NULL OR floor >= 1),
  CONSTRAINT ck_realty_floors_total CHECK (floors_total IS NULL OR floors_total >= 1),
  CONSTRAINT ck_realty_year CHECK (construction_year IS NULL OR construction_year >= 1800)
);
```

### 2.8 Directory (Справочник)

```sql
-- ============================================================
-- directory_organizations
-- ============================================================
CREATE TABLE directory_organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  city            VARCHAR(50),
  address         TEXT,
  coordinates     POINT,
  phone           TEXT,
  website         TEXT,
  email           TEXT,
  working_hours   JSONB NOT NULL DEFAULT '{}',
  photos          JSONB NOT NULL DEFAULT '[]',
  avg_rating      NUMERIC(3, 2) NOT NULL DEFAULT 0,
  reviews_count   INTEGER NOT NULL DEFAULT 0,
  status          directory_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_directory_rating CHECK (avg_rating >= 0 AND avg_rating <= 5),
  CONSTRAINT ck_directory_reviews_count CHECK (reviews_count >= 0)
);

-- ============================================================
-- directory_reviews
-- ============================================================
CREATE TABLE directory_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES directory_organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating            SMALLINT NOT NULL,
  text              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_directory_review_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT uq_directory_review_user UNIQUE (organization_id, user_id)
);
```

### 2.9 Media

```sql
-- ============================================================
-- media_files
-- ============================================================
CREATE TABLE media_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  filename        TEXT NOT NULL,
  original_name   TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  size_bytes      BIGINT NOT NULL,
  width           INTEGER,
  height          INTEGER,
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,
  bucket          TEXT NOT NULL,
  key             TEXT NOT NULL,
  alt_text        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_media_size CHECK (size_bytes > 0)
);

-- ============================================================
-- media_albums
-- ============================================================
CREATE TABLE media_albums (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- media_album_items
-- ============================================================
CREATE TABLE media_album_items (
  album_id    UUID NOT NULL REFERENCES media_albums(id) ON DELETE CASCADE,
  media_id    UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (album_id, media_id)
);
```

### 2.10 Weather

```sql
-- ============================================================
-- weather_cities (regular table)
-- ============================================================
CREATE TABLE weather_cities (
  city_code   VARCHAR(50) PRIMARY KEY,
  name        TEXT NOT NULL,
  name_ru     TEXT NOT NULL,
  latitude    NUMERIC(10, 7) NOT NULL,
  longitude   NUMERIC(10, 7) NOT NULL,
  region      TEXT,
  priority    INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- weather_data (TimescaleDB hypertable)
-- ============================================================
CREATE TABLE weather_data (
  time                TIMESTAMPTZ NOT NULL,
  city                VARCHAR(50) NOT NULL,
  temperature         NUMERIC(5, 2),
  feels_like          NUMERIC(5, 2),
  humidity            INTEGER,
  pressure            INTEGER,
  wind_speed          NUMERIC(5, 2),
  wind_direction      VARCHAR(10),
  cloudiness          INTEGER,
  visibility          INTEGER,
  weather_code        INTEGER,
  weather_description TEXT,
  sunrise             TIMESTAMPTZ,
  sunset              TIMESTAMPTZ,
  source              VARCHAR(50) NOT NULL DEFAULT 'openweather'
);

-- ============================================================
-- weather_alerts
-- ============================================================
CREATE TABLE weather_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city          VARCHAR(50) NOT NULL,
  alert_type    TEXT NOT NULL,
  severity      TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_weather_alert_severity CHECK (severity IN ('green', 'yellow', 'orange', 'red')),
  CONSTRAINT ck_weather_alert_dates CHECK (ends_at > starts_at)
);
```

### 2.11 Currency

```sql
-- ============================================================
-- currency_rates (TimescaleDB hypertable)
-- ============================================================
CREATE TABLE currency_rates (
  time        TIMESTAMPTZ NOT NULL,
  code        VARCHAR(10) NOT NULL,
  name        TEXT,
  nominal     INTEGER NOT NULL DEFAULT 1,
  value       NUMERIC(12, 4) NOT NULL,
  vunit_rate  NUMERIC(12, 6),
  source      VARCHAR(50) NOT NULL DEFAULT 'cbrf',

  PRIMARY KEY (code, time)
);
```

### 2.12 Transport

```sql
-- ============================================================
-- transport_flights
-- ============================================================
CREATE TABLE transport_flights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number   TEXT NOT NULL,
  airline         TEXT,
  departure_city  VARCHAR(50),
  arrival_city    VARCHAR(50),
  departure_time  TIMESTAMPTZ NOT NULL,
  arrival_time    TIMESTAMPTZ NOT NULL,
  status          TEXT,
  terminal        TEXT,
  gate            TEXT,
  date            DATE NOT NULL
);

-- ============================================================
-- transport_ferry
-- ============================================================
CREATE TABLE transport_ferry (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route           VARCHAR(50) NOT NULL,
  vessel_name     TEXT,
  departure_port  TEXT,
  arrival_port    TEXT,
  departure_time  TIMESTAMPTZ NOT NULL,
  arrival_time    TIMESTAMPTZ NOT NULL,
  status          TEXT,
  date            DATE NOT NULL,

  CONSTRAINT ck_ferry_route CHECK (route IN ('vanino-kholmsk', 'korsakov-wakkanai'))
);

-- ============================================================
-- transport_roads
-- ============================================================
CREATE TABLE transport_roads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  road_name             TEXT NOT NULL,
  section               TEXT,
  status                VARCHAR(50),
  condition_description TEXT,
  last_updated          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- transport_schedules
-- ============================================================
CREATE TABLE transport_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        VARCHAR(10) NOT NULL,
  route_name  TEXT NOT NULL,
  stops       JSONB NOT NULL DEFAULT '[]',
  schedule    JSONB NOT NULL DEFAULT '{}',
  city        VARCHAR(50),

  CONSTRAINT ck_transport_schedule_type CHECK (type IN ('bus', 'train'))
);
```

### 2.13 Notifications

```sql
-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB NOT NULL DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  channel     VARCHAR(20) NOT NULL DEFAULT 'push',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_notification_channel CHECK (channel IN ('email', 'push', 'sms', 'telegram', 'in_app'))
);

-- ============================================================
-- push_subscriptions
-- ============================================================
CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh_key  TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_push_endpoint UNIQUE (endpoint)
);
```

### 2.14 Newsletters

```sql
-- ============================================================
-- newsletters
-- ============================================================
CREATE TABLE newsletters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            VARCHAR(20) NOT NULL,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  status          newsletter_status NOT NULL DEFAULT 'draft',
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  target_audience JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_newsletter_type CHECK (type IN ('digest', 'urgent', 'thematic'))
);

-- ============================================================
-- newsletter_stats
-- ============================================================
CREATE TABLE newsletter_stats (
  newsletter_id       UUID PRIMARY KEY REFERENCES newsletters(id) ON DELETE CASCADE,
  sent_count          INTEGER NOT NULL DEFAULT 0,
  opened_count        INTEGER NOT NULL DEFAULT 0,
  clicked_count       INTEGER NOT NULL DEFAULT 0,
  unsubscribed_count  INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT ck_newsletter_stats_sent CHECK (sent_count >= 0),
  CONSTRAINT ck_newsletter_stats_opened CHECK (opened_count >= 0),
  CONSTRAINT ck_newsletter_stats_clicked CHECK (clicked_count >= 0),
  CONSTRAINT ck_newsletter_stats_unsub CHECK (unsubscribed_count >= 0)
);
```

### 2.15 Moderation

```sql
-- ============================================================
-- moderation_queue
-- ============================================================
CREATE TABLE moderation_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  VARCHAR(20) NOT NULL,
  content_id    UUID NOT NULL,
  reason        TEXT,
  reported_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  status        moderation_status NOT NULL DEFAULT 'pending',
  action_taken  TEXT,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_moderation_content_type CHECK (content_type IN ('comment', 'ad', 'event', 'job', 'realty', 'directory'))
);

-- ============================================================
-- moderation_rules
-- ============================================================
CREATE TABLE moderation_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type   TEXT NOT NULL,
  pattern     TEXT NOT NULL,
  action      TEXT NOT NULL,
  priority    INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.16 Analytics (TimescaleDB hypertable)

```sql
-- ============================================================
-- analytics_events (TimescaleDB hypertable)
-- ============================================================
CREATE TABLE analytics_events (
  time              TIMESTAMPTZ NOT NULL,
  event_type        VARCHAR(50) NOT NULL,
  user_id           UUID,
  page_url          TEXT,
  referrer          TEXT,
  device_type       VARCHAR(50),
  browser           VARCHAR(50),
  os                VARCHAR(50),
  country           VARCHAR(50),
  city              VARCHAR(50),
  ip_hash           TEXT,
  session_id        TEXT,
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,
  duration_seconds  INTEGER,
  data              JSONB NOT NULL DEFAULT '{}'
);
```

### 2.17 Billing

```sql
-- ============================================================
-- billing_tariffs
-- ============================================================
CREATE TABLE billing_tariffs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL,
  currency    VARCHAR(3) NOT NULL DEFAULT 'RUB',
  interval    tariff_interval NOT NULL,
  features    JSONB NOT NULL DEFAULT '[]',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_billing_tariff_price CHECK (price >= 0)
);

-- ============================================================
-- billing_subscriptions
-- ============================================================
CREATE TABLE billing_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tariff_id           UUID NOT NULL REFERENCES billing_tariffs(id) ON DELETE RESTRICT,
  status              TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end  TIMESTAMPTZ NOT NULL,
  canceled_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_billing_subscription_status CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
  CONSTRAINT ck_billing_subscription_period CHECK (current_period_end > current_period_start)
);

-- ============================================================
-- billing_transactions
-- ============================================================
CREATE TABLE billing_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          transaction_type NOT NULL,
  amount        NUMERIC(10, 2) NOT NULL,
  currency      VARCHAR(3) NOT NULL DEFAULT 'RUB',
  method        payment_method,
  status        payment_status NOT NULL DEFAULT 'pending',
  external_id   TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_billing_transaction_amount CHECK (amount > 0)
);
```

### 2.18 Advertising

```sql
-- ============================================================
-- advertising_placements
-- ============================================================
CREATE TABLE advertising_placements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,
  description     TEXT,
  zone            TEXT NOT NULL,
  width           INTEGER NOT NULL,
  height          INTEGER NOT NULL,
  price_per_day   NUMERIC(10, 2) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT uq_advertising_placement_code UNIQUE (code),
  CONSTRAINT ck_advertising_placement_price CHECK (price_per_day >= 0)
);

-- ============================================================
-- advertising_campaigns
-- ============================================================
CREATE TABLE advertising_campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  placement_id        UUID NOT NULL REFERENCES advertising_placements(id) ON DELETE RESTRICT,
  advertiser_name     TEXT NOT NULL,
  advertiser_contact  TEXT NOT NULL,
  image_url           TEXT NOT NULL,
  target_url          TEXT NOT NULL,
  starts_at           TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ NOT NULL,
  budget              NUMERIC(12, 2) NOT NULL,
  spent               NUMERIC(12, 2) NOT NULL DEFAULT 0,
  impressions_target  INTEGER,
  clicks_target       INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_advertising_campaign_budget CHECK (budget >= 0),
  CONSTRAINT ck_advertising_campaign_spent CHECK (spent >= 0),
  CONSTRAINT ck_advertising_campaign_dates CHECK (ends_at > starts_at)
);

-- ============================================================
-- advertising_impressions (TimescaleDB hypertable)
-- ============================================================
CREATE TABLE advertising_impressions (
  time        TIMESTAMPTZ NOT NULL,
  campaign_id UUID NOT NULL,
  type        VARCHAR(10) NOT NULL,
  ip_hash     TEXT,
  user_agent  TEXT,
  page_url    TEXT,

  CONSTRAINT ck_ad_impression_type CHECK (type IN ('impression', 'click'))
);
```

### 2.19 System

```sql
-- ============================================================
-- audit_log
-- ============================================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  changes     JSONB NOT NULL DEFAULT '{}',
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- system_settings
-- ============================================================
CREATE TABLE system_settings (
  key         VARCHAR(255) PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2.20 Triggers

```sql
-- ============================================================
-- Auto-update updated_at for all tables
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_news_articles_updated_at
  BEFORE UPDATE ON news_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_realty_updated_at
  BEFORE UPDATE ON realty
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_directory_orgs_updated_at
  BEFORE UPDATE ON directory_organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- media albums
CREATE TRIGGER trg_media_albums_updated_at
  BEFORE UPDATE ON media_albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- system settings
CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 3. Indexes

```sql
-- ============================================================
-- users
-- ============================================================
CREATE INDEX CONCURRENTLY idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_users_phone ON users(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY idx_users_status ON users(status);
CREATE INDEX CONCURRENTLY idx_users_karma ON users(karma DESC);
CREATE INDEX CONCURRENTLY idx_users_created ON users(created_at DESC);
CREATE INDEX CONCURRENTLY idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- sessions
CREATE INDEX CONCURRENTLY idx_sessions_user_id ON sessions(user_id);
CREATE INDEX CONCURRENTLY idx_sessions_expires ON sessions(expires_at);

-- oauth_accounts
CREATE INDEX CONCURRENTLY idx_oauth_user_id ON oauth_accounts(user_id);
CREATE INDEX CONCURRENTLY idx_oauth_provider ON oauth_accounts(provider, provider_account_id);

-- password_reset_tokens
CREATE INDEX CONCURRENTLY idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX CONCURRENTLY idx_password_reset_expires ON password_reset_tokens(expires_at);

-- verification_tokens
CREATE INDEX CONCURRENTLY idx_verification_user_id ON verification_tokens(user_id);
CREATE INDEX CONCURRENTLY idx_verification_expires ON verification_tokens(expires_at);

-- ============================================================
-- news_articles
-- ============================================================
CREATE INDEX CONCURRENTLY idx_news_slug ON news_articles(slug);
CREATE INDEX CONCURRENTLY idx_news_status ON news_articles(status);
CREATE INDEX CONCURRENTLY idx_news_category ON news_articles(category_id);
CREATE INDEX CONCURRENTLY idx_news_author ON news_articles(author_id);
CREATE INDEX CONCURRENTLY idx_news_city ON news_articles(city);
CREATE INDEX CONCURRENTLY idx_news_published ON news_articles(published_at DESC) WHERE status = 'published';
CREATE INDEX CONCURRENTLY idx_news_urgent ON news_articles(published_at DESC) WHERE is_urgent = TRUE AND status = 'published';
CREATE INDEX CONCURRENTLY idx_news_breaking ON news_articles(published_at DESC) WHERE is_breaking = TRUE AND status = 'published';
CREATE INDEX CONCURRENTLY idx_news_scheduled ON news_articles(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_news_created ON news_articles(created_at DESC);
CREATE INDEX CONCURRENTLY idx_news_views ON news_articles(views_count DESC) WHERE status = 'published';
CREATE INDEX CONCURRENTLY idx_news_deleted ON news_articles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_news_search ON news_articles USING gin(to_tsvector('russian', title || ' ' || coalesce(lead, '')));

-- news_tags
CREATE INDEX CONCURRENTLY idx_news_tags_tag ON news_tags(tag_id);
CREATE INDEX CONCURRENTLY idx_news_tags_news ON news_tags(news_id);

-- news_versions
CREATE INDEX CONCURRENTLY idx_news_versions_news ON news_versions(news_id, version_number DESC);
CREATE INDEX CONCURRENTLY idx_news_versions_changed_by ON news_versions(changed_by);

-- news_related
CREATE INDEX CONCURRENTLY idx_news_related_1 ON news_related(news_id_1);
CREATE INDEX CONCURRENTLY idx_news_related_2 ON news_related(news_id_2);

-- categories
CREATE INDEX CONCURRENTLY idx_categories_parent ON categories(parent_id);
CREATE INDEX CONCURRENTLY idx_categories_type ON categories(type);
CREATE INDEX CONCURRENTLY idx_categories_sort ON categories(type, sort_order);

-- tags
CREATE INDEX CONCURRENTLY idx_tags_slug ON tags(slug);

-- ============================================================
-- comments
-- ============================================================
CREATE INDEX CONCURRENTLY idx_comments_news ON comments(news_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_comments_author ON comments(author_id);
CREATE INDEX CONCURRENTLY idx_comments_parent ON comments(parent_id);
CREATE INDEX CONCURRENTLY idx_comments_status ON comments(status);
CREATE INDEX CONCURRENTLY idx_comments_pinned ON comments(news_id) WHERE is_pinned = TRUE;

-- comment_votes
CREATE INDEX CONCURRENTLY idx_comment_votes_user ON comment_votes(user_id);
CREATE INDEX CONCURRENTLY idx_comment_votes_comment ON comment_votes(comment_id);

-- comment_reports
CREATE INDEX CONCURRENTLY idx_comment_reports_status ON comment_reports(status);
CREATE INDEX CONCURRENTLY idx_comment_reports_comment ON comment_reports(comment_id);

-- ============================================================
-- events
-- ============================================================
CREATE INDEX CONCURRENTLY idx_events_category ON events(category_id);
CREATE INDEX CONCURRENTLY idx_events_organizer ON events(organizer_id);
CREATE INDEX CONCURRENTLY idx_events_city ON events(city);
CREATE INDEX CONCURRENTLY idx_events_dates ON events(start_date, end_date) WHERE status = 'published';
CREATE INDEX CONCURRENTLY idx_events_status ON events(status);
CREATE INDEX CONCURRENTLY idx_events_free ON events(start_date) WHERE is_free = TRUE AND status = 'published';
CREATE INDEX CONCURRENTLY idx_events_deleted ON events(deleted_at) WHERE deleted_at IS NOT NULL;

-- event_subscriptions
CREATE INDEX CONCURRENTLY idx_event_subs_user ON event_subscriptions(user_id);

-- ============================================================
-- ads
-- ============================================================
CREATE INDEX CONCURRENTLY idx_ads_category ON ads(category_id);
CREATE INDEX CONCURRENTLY idx_ads_user ON ads(user_id);
CREATE INDEX CONCURRENTLY idx_ads_city ON ads(city);
CREATE INDEX CONCURRENTLY idx_ads_status ON ads(status);
CREATE INDEX CONCURRENTLY idx_ads_price ON ads(price) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_ads_created ON ads(created_at DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_ads_deleted ON ads(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_ads_search ON ads USING gin(to_tsvector('russian', title || ' ' || description));

-- ads_promotions
CREATE INDEX CONCURRENTLY idx_ads_promotions_ad ON ads_promotions(ad_id);
CREATE INDEX CONCURRENTLY idx_ads_promotions_dates ON ads_promotions(starts_at, ends_at);
CREATE INDEX CONCURRENTLY idx_ads_promotions_level ON ads_promotions(level);

-- ============================================================
-- jobs
-- ============================================================
CREATE INDEX CONCURRENTLY idx_jobs_type ON jobs(type);
CREATE INDEX CONCURRENTLY idx_jobs_category ON jobs(category_id);
CREATE INDEX CONCURRENTLY idx_jobs_user ON jobs(user_id);
CREATE INDEX CONCURRENTLY idx_jobs_city ON jobs(city);
CREATE INDEX CONCURRENTLY idx_jobs_status ON jobs(status);
CREATE INDEX CONCURRENTLY idx_jobs_salary ON jobs(salary_min, salary_max) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_jobs_created ON jobs(created_at DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_jobs_deleted ON jobs(deleted_at) WHERE deleted_at IS NOT NULL;

-- job_responses
CREATE INDEX CONCURRENTLY idx_job_responses_job ON job_responses(job_id);
CREATE INDEX CONCURRENTLY idx_job_responses_user ON job_responses(user_id);

-- ============================================================
-- realty
-- ============================================================
CREATE INDEX CONCURRENTLY idx_realty_type ON realty(type);
CREATE INDEX CONCURRENTLY idx_realty_user ON realty(user_id);
CREATE INDEX CONCURRENTLY idx_realty_city ON realty(city);
CREATE INDEX CONCURRENTLY idx_realty_status ON realty(status);
CREATE INDEX CONCURRENTLY idx_realty_price ON realty(price) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_realty_rooms ON realty(rooms) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_realty_created ON realty(created_at DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_realty_deleted ON realty(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================
-- directory_organizations
-- ============================================================
CREATE INDEX CONCURRENTLY idx_directory_category ON directory_organizations(category_id);
CREATE INDEX CONCURRENTLY idx_directory_city ON directory_organizations(city);
CREATE INDEX CONCURRENTLY idx_directory_status ON directory_organizations(status);
CREATE INDEX CONCURRENTLY idx_directory_rating ON directory_organizations(avg_rating DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_directory_name ON directory_organizations USING gin(to_tsvector('russian', name));

-- directory_reviews
CREATE INDEX CONCURRENTLY idx_directory_reviews_org ON directory_reviews(organization_id);
CREATE INDEX CONCURRENTLY idx_directory_reviews_user ON directory_reviews(user_id);

-- ============================================================
-- media_files
-- ============================================================
CREATE INDEX CONCURRENTLY idx_media_user ON media_files(user_id);
CREATE INDEX CONCURRENTLY idx_media_mime ON media_files(mime_type);
CREATE INDEX CONCURRENTLY idx_media_created ON media_files(created_at DESC);

-- media_albums
CREATE INDEX CONCURRENTLY idx_media_albums_user ON media_albums(user_id);

-- media_album_items
CREATE INDEX CONCURRENTLY idx_media_album_items_media ON media_album_items(media_id);

-- ============================================================
-- weather
-- ============================================================
CREATE INDEX CONCURRENTLY idx_weather_data_city_time ON weather_data(city, time DESC);
CREATE INDEX CONCURRENTLY idx_weather_alerts_city ON weather_alerts(city);
CREATE INDEX CONCURRENTLY idx_weather_alerts_active ON weather_alerts(starts_at, ends_at);

-- ============================================================
-- currency
-- ============================================================
CREATE INDEX CONCURRENTLY idx_currency_code_time ON currency_rates(code, time DESC);

-- ============================================================
-- transport
-- ============================================================
CREATE INDEX CONCURRENTLY idx_transport_flights_date ON transport_flights(date);
CREATE INDEX CONCURRENTLY idx_transport_flights_departure ON transport_flights(departure_city, date);
CREATE INDEX CONCURRENTLY idx_transport_flights_arrival ON transport_flights(arrival_city, date);
CREATE INDEX CONCURRENTLY idx_transport_ferry_date ON transport_ferry(date);
CREATE INDEX CONCURRENTLY idx_transport_ferry_route ON transport_ferry(route, date);
CREATE INDEX CONCURRENTLY idx_transport_schedules_city ON transport_schedules(city, type);

-- ============================================================
-- notifications
-- ============================================================
CREATE INDEX CONCURRENTLY idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX CONCURRENTLY idx_notifications_type ON notifications(type);

-- push_subscriptions
CREATE INDEX CONCURRENTLY idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ============================================================
-- newsletters
-- ============================================================
CREATE INDEX CONCURRENTLY idx_newsletters_status ON newsletters(status);
CREATE INDEX CONCURRENTLY idx_newsletters_scheduled ON newsletters(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_newsletters_created_by ON newsletters(created_by);

-- ============================================================
-- moderation
-- ============================================================
CREATE INDEX CONCURRENTLY idx_moderation_queue_status ON moderation_queue(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_moderation_queue_type ON moderation_queue(content_type, status);
CREATE INDEX CONCURRENTLY idx_moderation_queue_reported ON moderation_queue(reported_by);
CREATE INDEX CONCURRENTLY idx_moderation_rules_active ON moderation_rules(is_active, priority DESC);

-- ============================================================
-- analytics_events
-- ============================================================
CREATE INDEX CONCURRENTLY idx_analytics_event_time ON analytics_events(event_type, time DESC);
CREATE INDEX CONCURRENTLY idx_analytics_session ON analytics_events(session_id);
CREATE INDEX CONCURRENTLY idx_analytics_user ON analytics_events(user_id, time DESC);

-- ============================================================
-- billing
-- ============================================================
CREATE INDEX CONCURRENTLY idx_billing_subscriptions_user ON billing_subscriptions(user_id);
CREATE INDEX CONCURRENTLY idx_billing_subscriptions_tariff ON billing_subscriptions(tariff_id);
CREATE INDEX CONCURRENTLY idx_billing_subscriptions_status ON billing_subscriptions(status);
CREATE INDEX CONCURRENTLY idx_billing_transactions_user ON billing_transactions(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_billing_transactions_status ON billing_transactions(status);
CREATE INDEX CONCURRENTLY idx_billing_transactions_external ON billing_transactions(external_id) WHERE external_id IS NOT NULL;

-- ============================================================
-- advertising
-- ============================================================
CREATE INDEX CONCURRENTLY idx_advertising_campaigns_placement ON advertising_campaigns(placement_id);
CREATE INDEX CONCURRENTLY idx_advertising_campaigns_dates ON advertising_campaigns(starts_at, ends_at) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_advertising_impressions_campaign ON advertising_impressions(campaign_id, time DESC);
CREATE INDEX CONCURRENTLY idx_advertising_impressions_type ON advertising_impressions(campaign_id, type, time DESC);

-- ============================================================
-- audit_log
-- ============================================================
CREATE INDEX CONCURRENTLY idx_audit_log_user ON audit_log(user_id);
CREATE INDEX CONCURRENTLY idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX CONCURRENTLY idx_audit_log_action ON audit_log(action);
CREATE INDEX CONCURRENTLY idx_audit_log_created ON audit_log(created_at DESC);
```

---

## 4. TimescaleDB Hypertables

```sql
-- ============================================================
-- Enable TimescaleDB extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================================
-- weather_data hypertable
-- chunk: 1 day, retention: 90 days
-- ============================================================
SELECT create_hypertable('weather_data', 'time',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);
SELECT add_retention_policy('weather_data', INTERVAL '90 days',
  if_not_exists => TRUE
);
SELECT add_compression_policy('weather_data', INTERVAL '7 days',
  if_not_exists => TRUE
);
ALTER TABLE weather_data SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'city',
  timescaledb.compress_orderby = 'time DESC'
);

-- ============================================================
-- currency_rates hypertable
-- chunk: 7 days, retention: 365 days
-- ============================================================
SELECT create_hypertable('currency_rates', 'time',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE
);
SELECT add_retention_policy('currency_rates', INTERVAL '365 days',
  if_not_exists => TRUE
);
SELECT add_compression_policy('currency_rates', INTERVAL '30 days',
  if_not_exists => TRUE
);
ALTER TABLE currency_rates SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'code',
  timescaledb.compress_orderby = 'time DESC'
);

-- ============================================================
-- analytics_events hypertable
-- chunk: 1 day, retention: 365 days
-- ============================================================
SELECT create_hypertable('analytics_events', 'time',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);
SELECT add_retention_policy('analytics_events', INTERVAL '365 days',
  if_not_exists => TRUE
);
SELECT add_compression_policy('analytics_events', INTERVAL '30 days',
  if_not_exists => TRUE
);
ALTER TABLE analytics_events SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'event_type',
  timescaledb.compress_orderby = 'time DESC'
);

-- ============================================================
-- advertising_impressions hypertable
-- chunk: 1 day, retention: 180 days
-- ============================================================
SELECT create_hypertable('advertising_impressions', 'time',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);
SELECT add_retention_policy('advertising_impressions', INTERVAL '180 days',
  if_not_exists => TRUE
);
SELECT add_compression_policy('advertising_impressions', INTERVAL '7 days',
  if_not_exists => TRUE
);
ALTER TABLE advertising_impressions SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'campaign_id, type',
  timescaledb.compress_orderby = 'time DESC'
);
```

---

## 5. Prisma Schema

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [timescaledb, uuidOssp, pgcrypto]
}

// ============================================================
// ENUMS
// ============================================================

enum UserRole {
  guest
  user
  journalist
  proofreader
  editor
  chief_editor
  moderator
  admin
  superadmin
}

enum UserStatus {
  active
  blocked
  deleted
}

enum NewsStatus {
  draft
  review
  published
  rejected
  archived
}

enum CommentStatus {
  pending
  approved
  rejected
  deleted
}

enum EventStatus {
  draft
  published
  cancelled
  completed
  archived
}

enum AdStatus {
  active
  pending
  rejected
  archived
}

enum JobType {
  vacancy
  resume
}

enum RealtyType {
  sale
  rent
  newbuild
  commercial
}

enum ContentType {
  news
  events
  ads
  directory
}

enum ModerationStatus {
  pending
  approved
  rejected
}

enum ReportReason {
  spam
  abuse
  offtopic
  harassment
  misinformation
  other
}

enum NotificationType {
  comment_reply
  comment_vote
  news_breaking
  news_urgent
  event_reminder
  ad_status
  job_response
  moderation_result
  newsletter
  billing
  system
}

enum PaymentMethod {
  card
  sbp
  crypto
  yookassa
}

enum PaymentStatus {
  pending
  succeeded
  failed
  refunded
  cancelled
}

enum TariffInterval {
  month
  quarter
  year
}

enum PromoteLevel {
  raise
  highlight
  urgent
  vip
}

enum NewsletterStatus {
  draft
  scheduled
  sending
  sent
  failed
}

// ============================================================
// MODELS
// ============================================================

model User {
  id                String    @id @default(uuid()) @db.Uuid
  email             String    @unique
  phone             String?
  passwordHash      String    @map("password_hash")
  role              UserRole  @default(user)
  status            UserStatus @default(active)
  name              String
  avatarUrl         String?   @map("avatar_url")
  bio               String?
  karma             Int       @default(0)
  level             Int       @default(1)
  isPhoneVerified   Boolean   @default(false) @map("is_phone_verified")
  isEmailVerified   Boolean   @default(false) @map("is_email_verified")
  twoFactorSecret   String?   @map("two_factor_secret")
  twoFactorEnabled  Boolean   @default(false) @map("two_factor_enabled")
  deletedAt         DateTime? @map("deleted_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @default(now()) @updatedAt @map("updated_at")

  settings           UserSettings?
  sessions           Session[]
  oauthAccounts      OAuthAccount[]
  passwordResetTokens PasswordResetToken[]
  verificationTokens VerificationToken[]
  newsArticles       NewsArticle[]       @relation("NewsAuthor")
  newsVersions       NewsVersion[]
  comments           Comment[]
  commentVotes       CommentVote[]
  commentReports     CommentReport[]
  events             Event[]             @relation("EventOrganizer")
  eventSubscriptions EventSubscription[]
  ads                Ad[]
  adsPromotions      AdPromotion[]
  jobs               Job[]
  jobResponses       JobResponse[]
  realty             Realty[]
  directoryReviews   DirectoryReview[]
  mediaFiles         MediaFile[]
  mediaAlbums        MediaAlbum[]
  notifications      Notification[]
  pushSubscriptions  PushSubscription[]
  newsletters        Newsletter[]
  moderationReports  ModerationQueue[]   @relation("ModerationReportedBy")
  moderationReviews  ModerationQueue[]   @relation("ModerationReviewedBy")
  moderationRules    ModerationRule[]
  billingSubscriptions BillingSubscription[]
  billingTransactions  BillingTransaction[]
  auditLogs          AuditLog[]
  systemSettings     SystemSetting[]

  @@map("users")
}

model UserSettings {
  userId             String  @id @map("user_id") @db.Uuid
  theme              String  @default("system")
  language           String  @default("ru")
  emailNotifications Boolean @default(true) @map("email_notifications")
  pushNotifications  Boolean @default(true) @map("push_notifications")
  smsNotifications   Boolean @default(false) @map("sms_notifications")
  privacyShowOnline  Boolean @default(true) @map("privacy_show_online")
  privacyShowAds     Boolean @default(true) @map("privacy_show_ads")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

model Session {
  id        String
  userId    String   @map("user_id") @db.Uuid
  expiresAt DateTime @map("expires_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([id])
  @@map("sessions")
}

model OAuthAccount {
  id                String        @id @default(uuid()) @db.Uuid
  userId            String        @map("user_id") @db.Uuid
  provider          OAuthProvider
  providerAccountId String        @map("provider_account_id")
  providerData      Json          @default("{}") @map("provider_data")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("oauth_accounts")
}

enum OAuthProvider {
  telegram
  vk
  yandex
}

model PasswordResetToken {
  tokenHash String   @id @map("token_hash")
  userId    String   @map("user_id") @db.Uuid
  expiresAt DateTime @map("expires_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("password_reset_tokens")
}

model VerificationToken {
  tokenHash String   @id @map("token_hash")
  userId    String   @map("user_id") @db.Uuid
  type      String
  expiresAt DateTime @map("expires_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("verification_tokens")
}

model Tag {
  id        String          @id @default(uuid()) @db.Uuid
  name      String          @unique
  slug      String          @unique
  createdAt DateTime        @default(now()) @map("created_at")

  newsTags NewsTag[]

  @@map("tags")
}

model Category {
  id          String      @id @default(uuid()) @db.Uuid
  name        String
  slug        String      @unique
  description String?
  icon        String?
  parentId    String?     @map("parent_id") @db.Uuid
  sortOrder   Int         @default(0) @map("sort_order")
  type        ContentType @default(news)

  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  news     NewsArticle[]
  events   Event[]
  ads      Ad[]
  jobs     Job[]
  directoryOrganizations DirectoryOrganization[]

  @@map("categories")
}

model NewsArticle {
  id                 String    @id @default(uuid()) @db.Uuid
  slug               String    @unique
  title              String
  lead               String?
  content            String
  mainImageUrl       String?   @map("main_image_url")
  mainImageThumbnail String?   @map("main_image_thumbnail")
  gallery            Json      @default("[]")
  videoUrl           String?   @map("video_url")
  videoType          String?   @map("video_type")
  videoDuration      Int?      @map("video_duration")
  categoryId         String?   @map("category_id") @db.Uuid
  authorId           String?   @map("author_id") @db.Uuid
  city               String?
  status             NewsStatus @default(draft)
  isUrgent           Boolean   @default(false) @map("is_urgent")
  isPremium          Boolean   @default(false) @map("is_premium")
  isBreaking         Boolean   @default(false) @map("is_breaking")
  publishedAt        DateTime? @map("published_at")
  scheduledAt        DateTime? @map("scheduled_at")
  sourceName         String?   @map("source_name")
  sourceUrl          String?   @map("source_url")
  seoTitle           String?   @map("seo_title")
  seoDescription     String?   @map("seo_description")
  seoOgImage         String?   @map("seo_og_image")
  viewsCount         Int       @default(0) @map("views_count")
  commentsCount      Int       @default(0) @map("comments_count")
  readingTimeMinutes Int?      @map("reading_time_minutes")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @default(now()) @updatedAt @map("updated_at")
  deletedAt          DateTime? @map("deleted_at")

  category      Category?       @relation(fields: [categoryId], references: [id])
  author        User?           @relation("NewsAuthor", fields: [authorId], references: [id])
  newsTags      NewsTag[]
  versions      NewsVersion[]
  relatedFrom   NewsRelated[]   @relation("RelatedFrom")
  relatedTo     NewsRelated[]   @relation("RelatedTo")
  comments      Comment[]

  @@map("news_articles")
}

model NewsTag {
  newsId String @map("news_id") @db.Uuid
  tagId  String @map("tag_id") @db.Uuid

  news NewsArticle @relation(fields: [newsId], references: [id], onDelete: Cascade)
  tag  Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([newsId, tagId])
  @@map("news_tags")
}

model NewsVersion {
  id            String   @id @default(uuid()) @db.Uuid
  newsId        String   @map("news_id") @db.Uuid
  versionNumber Int      @map("version_number")
  title         String
  lead          String?
  content       String
  changedBy     String?  @map("changed_by") @db.Uuid
  changeReason  String?  @map("change_reason")
  createdAt     DateTime @default(now()) @map("created_at")

  news    NewsArticle @relation(fields: [newsId], references: [id], onDelete: Cascade)
  changed User?       @relation(fields: [changedBy], references: [id])

  @@unique([newsId, versionNumber])
  @@map("news_versions")
}

model NewsRelated {
  newsId1 String @map("news_id_1") @db.Uuid
  newsId2 String @map("news_id_2") @db.Uuid
  score   Float  @default(0)

  newsFrom NewsArticle @relation("RelatedFrom", fields: [newsId1], references: [id], onDelete: Cascade)
  newsTo   NewsArticle @relation("RelatedTo", fields: [newsId2], references: [id], onDelete: Cascade)

  @@id([newsId1, newsId2])
  @@map("news_related")
}

model Comment {
  id            String        @id @default(uuid()) @db.Uuid
  newsId        String?       @map("news_id") @db.Uuid
  authorId      String        @map("author_id") @db.Uuid
  parentId      String?       @map("parent_id") @db.Uuid
  content       String
  status        CommentStatus @default(pending)
  likesCount    Int           @default(0) @map("likes_count")
  dislikesCount Int           @default(0) @map("dislikes_count")
  isPinned      Boolean       @default(false) @map("is_pinned")
  isEdited      Boolean       @default(false) @map("is_edited")
  editedAt      DateTime?     @map("edited_at")
  createdAt     DateTime      @default(now()) @map("created_at")
  deletedAt     DateTime?     @map("deleted_at")

  news      NewsArticle?   @relation(fields: [newsId], references: [id])
  author    User           @relation(fields: [authorId], references: [id])
  parent    Comment?       @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[]      @relation("CommentReplies")
  votes     CommentVote[]
  reports   CommentReport[]

  @@map("comments")
}

model CommentVote {
  commentId String @map("comment_id") @db.Uuid
  userId    String @map("user_id") @db.Uuid
  vote      Int    @default(0)

  comment Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([commentId, userId])
  @@map("comment_votes")
}

model CommentReport {
  id          String           @id @default(uuid()) @db.Uuid
  commentId   String           @map("comment_id") @db.Uuid
  reporterId  String           @map("reporter_id") @db.Uuid
  reason      ReportReason
  description String?
  status      ModerationStatus @default(pending)
  createdAt   DateTime         @default(now()) @map("created_at")

  comment  Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  reporter User    @relation(fields: [reporterId], references: [id])

  @@map("comment_reports")
}

model CommentBlacklist {
  id        String   @id @default(uuid()) @db.Uuid
  word      String   @unique
  createdBy String?  @map("created_by") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  creator User? @relation(fields: [createdBy], references: [id])

  @@map("comment_blacklist")
}

model Event {
  id                String      @id @default(uuid()) @db.Uuid
  title             String
  description       String
  shortDescription  String?     @map("short_description")
  categoryId        String?     @map("category_id") @db.Uuid
  organizerId       String?     @map("organizer_id") @db.Uuid
  city              String?
  venueName         String?     @map("venue_name")
  venueAddress      String?     @map("venue_address")
  venueCoordinates  Unsupported("point")? @map("venue_coordinates")
  startDate         DateTime    @map("start_date")
  endDate           DateTime?   @map("end_date")
  isFree            Boolean     @default(true) @map("is_free")
  price             Decimal?    @db.Decimal(10, 2)
  currency          String      @default("RUB")
  imageUrl          String?     @map("image_url")
  status            EventStatus @default(draft)
  isRecurring       Boolean     @default(false) @map("is_recurring")
  recurrenceRule    String?     @map("recurrence_rule")
  maxParticipants   Int?        @map("max_participants")
  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @default(now()) @updatedAt @map("updated_at")
  deletedAt         DateTime?   @map("deleted_at")

  category      Category?            @relation(fields: [categoryId], references: [id])
  organizer     User?                @relation("EventOrganizer", fields: [organizerId], references: [id])
  subscriptions EventSubscription[]

  @@map("events")
}

model EventSubscription {
  eventId   String   @map("event_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([eventId, userId])
  @@map("event_subscriptions")
}

model Ad {
  id          String   @id @default(uuid()) @db.Uuid
  title       String
  description String
  categoryId  String?  @map("category_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  city        String?
  price       Decimal? @db.Decimal(10, 2)
  condition   String?
  phone       String?
  images      Json     @default("[]")
  status      AdStatus @default(pending)
  viewsCount  Int      @default(0) @map("views_count")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  category   Category?       @relation(fields: [categoryId], references: [id])
  user       User            @relation(fields: [userId], references: [id])
  promotions AdPromotion[]

  @@map("ads")
}

model AdPromotion {
  id        String       @id @default(uuid()) @db.Uuid
  adId      String       @map("ad_id") @db.Uuid
  level     PromoteLevel
  startsAt  DateTime     @default(now()) @map("starts_at")
  endsAt    DateTime     @map("ends_at")
  paymentId String?      @map("payment_id") @db.Uuid
  createdAt DateTime     @default(now()) @map("created_at")

  ad  Ad   @relation(fields: [adId], references: [id], onDelete: Cascade)

  @@map("ads_promotions")
}

model Job {
  id          String   @id @default(uuid()) @db.Uuid
  type        JobType
  title       String
  description String
  categoryId  String?  @map("category_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  city        String?
  salaryMin   Decimal? @map("salary_min") @db.Decimal(10, 2)
  salaryMax   Decimal? @map("salary_max") @db.Decimal(10, 2)
  currency    String?  @default("RUB")
  schedule    String?
  experience  String?
  companyName String?  @map("company_name")
  contacts    Json     @default("{}")
  status      AdStatus @default(pending)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  category  Category?      @relation(fields: [categoryId], references: [id])
  user      User           @relation(fields: [userId], references: [id])
  responses JobResponse[]

  @@map("jobs")
}

model JobResponse {
  id        String   @id @default(uuid()) @db.Uuid
  jobId     String   @map("job_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  message   String?
  resumeUrl String?  @map("resume_url")
  createdAt DateTime @default(now()) @map("created_at")

  job  Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@map("job_responses")
}

model Realty {
  id               String     @id @default(uuid()) @db.Uuid
  type             RealtyType
  title            String
  description      String
  userId           String     @map("user_id") @db.Uuid
  city             String?
  district         String?
  address          String?
  price            Decimal?   @db.Decimal(12, 2)
  currency         String?    @default("RUB")
  rooms            Int?
  areaTotal        Decimal?   @map("area_total") @db.Decimal(10, 2)
  areaLiving       Decimal?   @map("area_living") @db.Decimal(10, 2)
  floor            Int?
  floorsTotal      Int?       @map("floors_total")
  houseType        String?    @map("house_type")
  constructionYear Int?       @map("construction_year")
  condition        String?
  landArea         Decimal?   @map("land_area") @db.Decimal(10, 2)
  coordinates      Unsupported("point")?
  images           Json       @default("[]")
  phone            String?
  status           AdStatus   @default(pending)
  createdAt        DateTime   @default(now()) @map("created_at")
  updatedAt        DateTime   @default(now()) @updatedAt @map("updated_at")
  deletedAt        DateTime?  @map("deleted_at")

  user User @relation(fields: [userId], references: [id])

  @@map("realty")
}

model DirectoryOrganization {
  id            String          @id @default(uuid()) @db.Uuid
  name          String
  description   String?
  categoryId    String?         @map("category_id") @db.Uuid
  city          String?
  address       String?
  coordinates   Unsupported("point")?
  phone         String?
  website       String?
  email         String?
  workingHours  Json            @default("{}") @map("working_hours")
  photos        Json            @default("[]")
  avgRating     Decimal         @default(0) @map("avg_rating") @db.Decimal(3, 2)
  reviewsCount  Int             @default(0) @map("reviews_count")
  status        DirectoryStatus @default(pending)
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @default(now()) @updatedAt @map("updated_at")

  category Category?          @relation(fields: [categoryId], references: [id])
  reviews  DirectoryReview[]

  @@map("directory_organizations")
}

enum DirectoryStatus {
  active
  pending
  rejected
  archived
}

model DirectoryReview {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  rating         Int
  text           String?
  createdAt      DateTime @default(now()) @map("created_at")

  organization DirectoryOrganization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User                  @relation(fields: [userId], references: [id])

  @@unique([organizationId, userId])
  @@map("directory_reviews")
}

model MediaFile {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String?  @map("user_id") @db.Uuid
  filename      String
  originalName  String   @map("original_name")
  mimeType      String   @map("mime_type")
  sizeBytes     BigInt   @map("size_bytes")
  width         Int?
  height        Int?
  url           String
  thumbnailUrl  String?  @map("thumbnail_url")
  bucket        String
  key           String
  altText       String?  @map("alt_text")
  createdAt     DateTime @default(now()) @map("created_at")

  user      User?              @relation(fields: [userId], references: [id])
  albumItems MediaAlbumItem[]

  @@map("media_files")
}

model MediaAlbum {
  id             String     @id @default(uuid()) @db.Uuid
  userId         String     @map("user_id") @db.Uuid
  title          String
  description    String?
  coverImageUrl  String?    @map("cover_image_url")
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @default(now()) @updatedAt @map("updated_at")

  user  User              @relation(fields: [userId], references: [id])
  items MediaAlbumItem[]

  @@map("media_albums")
}

model MediaAlbumItem {
  albumId   String @map("album_id") @db.Uuid
  mediaId   String @map("media_id") @db.Uuid
  sortOrder Int    @default(0) @map("sort_order")

  album MediaAlbum @relation(fields: [albumId], references: [id], onDelete: Cascade)
  media MediaFile @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  @@id([albumId, mediaId])
  @@map("media_album_items")
}

// --- Weather (regular tables) ---

model WeatherCity {
  cityCode String  @id @map("city_code")
  name     String
  nameRu   String  @map("name_ru")
  latitude Decimal @db.Decimal(10, 7)
  longitude Decimal @db.Decimal(10, 7)
  region   String?
  priority Int     @default(0)
  isActive Boolean @default(true) @map("is_active")

  @@map("weather_cities")
}

model WeatherAlert {
  id          String   @id @default(uuid()) @db.Uuid
  city        String
  alertType   String   @map("alert_type")
  severity    String
  title       String
  description String?
  startsAt    DateTime @map("starts_at")
  endsAt      DateTime @map("ends_at")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("weather_alerts")
}

// --- Transport ---

model TransportFlight {
  id            String   @id @default(uuid()) @db.Uuid
  flightNumber  String   @map("flight_number")
  airline       String?
  departureCity String?  @map("departure_city")
  arrivalCity   String?  @map("arrival_city")
  departureTime DateTime @map("departure_time")
  arrivalTime   DateTime @map("arrival_time")
  status        String?
  terminal      String?
  gate          String?
  date          DateTime @db.Date

  @@map("transport_flights")
}

model TransportFerry {
  id             String   @id @default(uuid()) @db.Uuid
  route          String
  vesselName     String?  @map("vessel_name")
  departurePort  String?  @map("departure_port")
  arrivalPort    String?  @map("arrival_port")
  departureTime  DateTime @map("departure_time")
  arrivalTime    DateTime @map("arrival_time")
  status         String?
  date           DateTime @db.Date

  @@map("transport_ferry")
}

model TransportRoad {
  id                   String   @id @default(uuid()) @db.Uuid
  roadName             String   @map("road_name")
  section              String?
  status               String?
  conditionDescription String?  @map("condition_description")
  lastUpdated          DateTime @default(now()) @map("last_updated")

  @@map("transport_roads")
}

model TransportSchedule {
  id        String @id @default(uuid()) @db.Uuid
  type      String
  routeName String @map("route_name")
  stops     Json   @default("[]")
  schedule  Json   @default("{}")
  city      String?

  @@map("transport_schedules")
}

// --- Notifications ---

model Notification {
  id        String           @id @default(uuid()) @db.Uuid
  userId    String           @map("user_id") @db.Uuid
  type      NotificationType
  title     String
  body      String?
  data      Json             @default("{}")
  isRead    Boolean          @default(false) @map("is_read")
  channel   String           @default("push")
  createdAt DateTime         @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model PushSubscription {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  endpoint  String   @unique
  p256dhKey String   @map("p256dh_key")
  authKey   String   @map("auth_key")
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("push_subscriptions")
}

// --- Newsletters ---

model Newsletter {
  id              String          @id @default(uuid()) @db.Uuid
  type            String
  title           String
  content         String
  scheduledAt     DateTime?       @map("scheduled_at")
  sentAt          DateTime?       @map("sent_at")
  status          NewsletterStatus @default(draft)
  createdBy       String?         @map("created_by") @db.Uuid
  targetAudience  Json            @default("{}") @map("target_audience")
  createdAt       DateTime        @default(now()) @map("created_at")

  creator User?            @relation(fields: [createdBy], references: [id])
  stats   NewsletterStats?

  @@map("newsletters")
}

model NewsletterStats {
  newsletterId      String @id @map("newsletter_id") @db.Uuid
  sentCount         Int    @default(0) @map("sent_count")
  openedCount       Int    @default(0) @map("opened_count")
  clickedCount      Int    @default(0) @map("clicked_count")
  unsubscribedCount Int    @default(0) @map("unsubscribed_count")

  newsletter Newsletter @relation(fields: [newsletterId], references: [id], onDelete: Cascade)

  @@map("newsletter_stats")
}

// --- Moderation ---

model ModerationQueue {
  id          String           @id @default(uuid()) @db.Uuid
  contentType String           @map("content_type")
  contentId   String           @map("content_id") @db.Uuid
  reason      String?
  reportedBy  String?          @map("reported_by") @db.Uuid
  reviewedBy  String?          @map("reviewed_by") @db.Uuid
  status      ModerationStatus @default(pending)
  actionTaken String?          @map("action_taken")
  reviewedAt  DateTime?        @map("reviewed_at")
  createdAt   DateTime         @default(now()) @map("created_at")

  reporter User? @relation("ModerationReportedBy", fields: [reportedBy], references: [id])
  reviewer User? @relation("ModerationReviewedBy", fields: [reviewedBy], references: [id])

  @@map("moderation_queue")
}

model ModerationRule {
  id        String   @id @default(uuid()) @db.Uuid
  ruleType  String   @map("rule_type")
  pattern   String
  action    String
  priority  Int      @default(0)
  isActive  Boolean  @default(true) @map("is_active")
  createdBy String?  @map("created_by") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  creator User? @relation(fields: [createdBy], references: [id])

  @@map("moderation_rules")
}

// --- Billing ---

model BillingTariff {
  id          String         @id @default(uuid()) @db.Uuid
  name        String
  description String?
  price       Decimal        @db.Decimal(10, 2)
  currency    String         @default("RUB")
  interval    TariffInterval
  features    Json           @default("[]")
  isActive    Boolean        @default(true) @map("is_active")
  sortOrder   Int            @default(0) @map("sort_order")
  createdAt   DateTime       @default(now()) @map("created_at")

  subscriptions BillingSubscription[]

  @@map("billing_tariffs")
}

model BillingSubscription {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @map("user_id") @db.Uuid
  tariffId          String   @map("tariff_id") @db.Uuid
  status            String   @default("active")
  currentPeriodStart DateTime @default(now()) @map("current_period_start")
  currentPeriodEnd   DateTime @map("current_period_end")
  canceledAt        DateTime? @map("canceled_at")
  createdAt         DateTime @default(now()) @map("created_at")

  user   User           @relation(fields: [userId], references: [id])
  tariff BillingTariff  @relation(fields: [tariffId], references: [id])

  @@map("billing_subscriptions")
}

model BillingTransaction {
  id          String        @id @default(uuid()) @db.Uuid
  userId      String        @map("user_id") @db.Uuid
  type        TransactionType
  amount      Decimal       @db.Decimal(10, 2)
  currency    String        @default("RUB")
  method      PaymentMethod?
  status      PaymentStatus @default(pending)
  externalId  String?       @map("external_id")
  description String?
  createdAt   DateTime      @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("billing_transactions")
}

enum TransactionType {
  payment
  refund
  subscription
  promotion
}

// --- Advertising ---

model AdvertisingPlacement {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  code        String   @unique
  description String?
  zone        String
  width       Int
  height      Int
  pricePerDay Decimal  @map("price_per_day") @db.Decimal(10, 2)
  isActive    Boolean  @default(true) @map("is_active")

  campaigns AdvertisingCampaign[]

  @@map("advertising_placements")
}

model AdvertisingCampaign {
  id                 String   @id @default(uuid()) @db.Uuid
  name               String
  placementId        String   @map("placement_id") @db.Uuid
  advertiserName     String   @map("advertiser_name")
  advertiserContact  String   @map("advertiser_contact")
  imageUrl           String   @map("image_url")
  targetUrl          String   @map("target_url")
  startsAt           DateTime @map("starts_at")
  endsAt             DateTime @map("ends_at")
  budget             Decimal  @db.Decimal(12, 2)
  spent              Decimal  @default(0) @db.Decimal(12, 2)
  impressionsTarget  Int?     @map("impressions_target")
  clicksTarget       Int?     @map("clicks_target")
  isActive           Boolean  @default(true) @map("is_active")
  createdAt          DateTime @default(now()) @map("created_at")

  placement AdvertisingPlacement @relation(fields: [placementId], references: [id])

  @@map("advertising_campaigns")
}

// --- System ---

model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String?  @map("user_id") @db.Uuid
  action     String
  entityType String   @map("entity_type")
  entityId   String?  @map("entity_id") @db.Uuid
  changes    Json     @default("{}")
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id])

  @@map("audit_log")
}

model SystemSetting {
  key       String    @id
  value     Json      @default("{}")
  updatedBy String?   @map("updated_by") @db.Uuid
  updatedAt DateTime  @default(now()) @updatedAt @map("updated_at")

  updater User? @relation(fields: [updatedBy], references: [id])

  @@map("system_settings")
}
```

---

## 6. Seed Data

```sql
-- ============================================================
-- 1. Сахалинские города
-- ============================================================
INSERT INTO weather_cities (city_code, name, name_ru, latitude, longitude, region, priority, is_active) VALUES
  ('yuzhno-sakhalinsk', 'Yuzhno-Sakhalinsk', 'Южно-Сахалинск', 46.9591667, 142.7380556, 'Сахалинская область', 100, TRUE),
  ('korsakov', 'Korsakov', 'Корсаков', 46.6341667, 142.7772222, 'Сахалинская область', 80, TRUE),
  ('kholmsk', 'Kholmsk', 'Холмск', 47.0477778, 142.0419444, 'Сахалинская область', 80, TRUE),
  ('dolinsk', 'Dolinsk', 'Долинск', 47.3255556, 142.7930556, 'Сахалинская область', 60, TRUE),
  ('nevelsk', 'Nevelsk', 'Невельск', 46.6527778, 141.8625000, 'Сахалинская область', 60, TRUE),
  ('poronaysk', 'Poronaysk', 'Поронайск', 49.2205556, 143.1072222, 'Сахалинская область', 60, TRUE),
  ('aleksandrovsk-sakhalinsky', 'Aleksandrovsk-Sakhalinsky', 'Александровск-Сахалинский', 50.8991667, 142.1622222, 'Сахалинская область', 50, TRUE),
  ('okha', 'Okha', 'Оха', 53.5738889, 142.9472222, 'Сахалинская область', 70, TRUE),
  ('aniva', 'Aniva', 'Анива', 46.7150000, 142.5286111, 'Сахалинская область', 50, TRUE),
  ('sovetskaya-gavan', 'Sovetskaya Gavan', 'Советская Гавань', 48.9666667, 140.2833333, 'Хабаровский край', 40, TRUE),
  ('kurilsk', 'Kurilsk', 'Курильск', 45.2500000, 147.8833333, 'Сахалинская область', 40, TRUE),
  ('severokurilsk', 'Severo-Kurilsk', 'Северо-Курильск', 50.6833333, 156.1166667, 'Сахалинская область', 40, TRUE),
  ('shakhtersk', 'Shakhtersk', 'Шахтёрск', 49.1588889, 142.1313889, 'Сахалинская область', 30, TRUE);

-- ============================================================
-- 2. Административные роли
-- ============================================================
INSERT INTO users (id, email, phone, password_hash, role, status, name, is_phone_verified, is_email_verified) VALUES
  (gen_random_uuid(), 'admin@sakhcom.ru', '+7 (4242) 00-00-01',
   '$argon2id$v=19$m=65536,t=3,p=4$CHANGE_ME_ADMIN_HASH',  -- ⚠️ replace with real hash
   'superadmin', 'active', 'Главный администратор', TRUE, TRUE);

-- ============================================================
-- 3. Базовые категории
-- ============================================================
-- News categories
INSERT INTO categories (id, name, slug, description, type, sort_order) VALUES
  (gen_random_uuid(), 'Общество',     'obshchestvo',     'Новости общества Сахалина',      'news', 1),
  (gen_random_uuid(), 'Политика',     'politika',        'Политические новости',           'news', 2),
  (gen_random_uuid(), 'Экономика',    'ekonomika',       'Экономика и бизнес',             'news', 3),
  (gen_random_uuid(), 'Происшествия', 'proisshestviya',  'ЧП и происшествия',              'news', 4),
  (gen_random_uuid(), 'Спорт',        'sport',           'Спортивные новости',             'news', 5),
  (gen_random_uuid(), 'Культура',     'kultura',         'Культура и искусство',           'news', 6),
  (gen_random_uuid(), 'Наука',        'nauka',           'Наука и технологии',             'news', 7),
  (gen_random_uuid(), 'Туризм',       'turizm',          'Туризм и отдых на Сахалине',     'news', 8),
  (gen_random_uuid(), 'ЖКХ',          'zhkkh',           'Жилищно-коммунальное хозяйство', 'news', 9),
  (gen_random_uuid(), 'Образование',  'obrazovanie',     'Образование',                    'news', 10);

-- Events categories
INSERT INTO categories (id, name, slug, description, type, sort_order) VALUES
  (gen_random_uuid(), 'Концерты',    'koncerty',     'Концерты и музыка',        'events', 1),
  (gen_random_uuid(), 'Театр',       'teatr',        'Театральные постановки',   'events', 2),
  (gen_random_uuid(), 'Выставки',    'vystavki',     'Выставки и экспозиции',    'events', 3),
  (gen_random_uuid(), 'Спектакли',   'spektakli',    'Спектакли и шоу',          'events', 4),
  (gen_random_uuid(), 'Спорт',       'sport-events', 'Спортивные мероприятия',   'events', 5),
  (gen_random_uuid(), 'Детям',       'detyam',       'Мероприятия для детей',    'events', 6);

-- Ads categories
INSERT INTO categories (id, name, slug, description, type, sort_order) VALUES
  (gen_random_uuid(), 'Транспорт',   'transport-ads',   'Продажа/покупка авто',    'ads', 1),
  (gen_random_uuid(), 'Недвижимость','nedvizhimost',    'Купля-продажа квартир',   'ads', 2),
  (gen_random_uuid(), 'Работа',      'rabota',          'Вакансии и резюме',       'ads', 3),
  (gen_random_uuid(), 'Услуги',      'uslugi',          'Бытовые услуги',          'ads', 4),
  (gen_random_uuid(), 'Электроника', 'elektronika',     'Техника и электроника',   'ads', 5),
  (gen_random_uuid(), 'Одежда',      'odezhda',         'Одежда и аксессуары',     'ads', 6);

-- Directory categories
INSERT INTO categories (id, name, slug, description, type, sort_order) VALUES
  (gen_random_uuid(), 'Медицина',      'medicina',       'Больницы и поликлиники',       'directory', 1),
  (gen_random_uuid(), 'Образование',   'obrazovanie-org','Школы и ВУЗы',                 'directory', 2),
  (gen_random_uuid(), 'Рестораны',     'restorany',      'Кафе и рестораны',             'directory', 3),
  (gen_random_uuid(), 'Гостиницы',     'gostinicy',      'Отели и гостиницы',            'directory', 4),
  (gen_random_uuid(), 'Госуслуги',     'gosuslugi',      'Государственные учреждения',   'directory', 5),
  (gen_random_uuid(), 'Транспорт',     'transport-org',  'Транспортные компании',        'directory', 6);

-- ============================================================
-- 4. Тарифы Sakhcom+
-- ============================================================
INSERT INTO billing_tariffs (id, name, description, price, currency, interval, features, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Sakhcom+ Базовый',
   'Доступ к премиум-материалам без рекламы',
   299.00, 'RUB', 'month',
   '["Без рекламы", "Премиум-статьи", "Закладки"]'::jsonb,
   1, TRUE),

  (gen_random_uuid(), 'Sakhcom+ Годовой',
   'Все возможности Sakhcom+ со скидкой 20%',
   2990.00, 'RUB', 'year',
   '["Без рекламы", "Премиум-статьи", "Закладки", "Приоритетная поддержка", "Эксклюзивные рассылки"]'::jsonb,
   2, TRUE),

  (gen_random_uuid(), 'Sakhcom+ Для СМИ',
   'Для журналистов и редакций',
   990.00, 'RUB', 'month',
   '["Без рекламы", "Премиум-статьи", "API-доступ", "Аналитика", "Приоритет в поддержке", "5+ пользователей"]'::jsonb,
   3, TRUE);

-- ============================================================
-- 5. Настройки для админа
-- ============================================================
INSERT INTO user_settings (user_id) VALUES
  ((SELECT id FROM users WHERE email = 'admin@sakhcom.ru'));

-- ============================================================
-- 6. Системные настройки
-- ============================================================
INSERT INTO system_settings (key, value) VALUES
  ('site.name', '"Sakhcom — Сахалин"'),
  ('site.description', '"Новости Сахалина и Курильских островов"'),
  ('site.url', '"https://sakhcom.ru"'),
  ('site.api_url', '"https://api.sakhcom.ru/v1"'),
  ('seo.default_title', '"Sakhcom — Новости Сахалина"'),
  ('seo.default_description', '"Актуальные новости Сахалинской области, Южно-Сахалинска и Курильских островов. Афиша, объявления, погода, транспорт."'),
  ('features.news_comments', 'true'),
  ('features.news_urgent', 'true'),
  ('features.news_breaking', 'true'),
  ('features.social_login', 'true'),
  ('features.2fa', 'false'),
  ('limits.news_title_max_length', '200'),
  ('limits.comment_max_length', '2000'),
  ('limits.media_max_size_mb', '50'),
  ('limits.media_allowed_types', '["image/jpeg","image/png","image/webp","video/mp4","application/pdf"]'::jsonb);

-- ============================================================
-- 7. Рекламные места
-- ============================================================
INSERT INTO advertising_placements (id, name, code, description, zone, width, height, price_per_day, is_active) VALUES
  (gen_random_uuid(), 'Главный баннер (шапка)', 'header_banner', 'Баннер в верхней части сайта', 'header', 1200, 90, 5000.00, TRUE),
  (gen_random_uuid(), 'Сайдбар (правый)', 'sidebar_right', 'Прямоугольный баннер в правой колонке', 'sidebar', 300, 250, 3000.00, TRUE),
  (gen_random_uuid(), 'Внутри статьи (верх)', 'article_top', 'Баннер в верхней части статьи', 'article', 728, 90, 2000.00, TRUE),
  (gen_random_uuid(), 'Внутри статьи (середина)', 'article_middle', 'Баннер между абзацами', 'article', 728, 90, 2500.00, TRUE),
  (gen_random_uuid(), 'Мобильный (низ)', 'mobile_bottom', 'Баннер внизу на мобильных устройствах', 'mobile', 320, 50, 1500.00, TRUE);
```

---

## 7. Deployment Script (one-shot)

```bash
#!/bin/bash
# ============================================================
# Run: psql -U postgres -d sakhcom -f database-schema.sql
# ============================================================

echo "=== Sakhcom Database Schema Deployment ==="
echo "Database: PostgreSQL 16 + TimescaleDB"

# Create database
psql -U postgres -c "CREATE DATABASE sakhcom;"
psql -U postgres -d sakhcom -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"
psql -U postgres -d sakhcom -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U postgres -d sakhcom -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Run full schema
psql -U postgres -d sakhcom -f database-schema.sql

echo "=== Schema deployed successfully ==="
```
