# Деплой: Render + Neon (бесплатные планы)

Схема для пилота и демо. Статус: **развёрнуто 2026-10-05**. Лимиты бесплатных планов меняются —
перед изменениями сверьте их на сайтах Render и Neon.

```
Браузер ─► Render: q-trade (Angular SSR, Node) ─/api─► Render: q-trade-business (Express) ─► Neon (PostgreSQL)
                                                          └─ фото и PDF из storage/ (лежат в git)
```

| Что               | Где                                                                  |
| ----------------- | -------------------------------------------------------------------- |
| Фронтенд          | https://q-trade.onrender.com — Render, Frankfurt, Free, ветка `main` |
| API               | https://q-trade-business.onrender.com — Render, Frankfurt, Free      |
| База              | Neon, проект `q-trade`, Frankfurt, PostgreSQL 18, БД `neondb`        |
| Репозитории       | GitHub `MaulenUser/q-trade` и `MaulenUser/q-trade-business`          |
| Автодеплой Render | при каждом push в `main` соответствующего репозитория                |
| Remote в копиях   | `maulen` — актуальный (MaulenUser); `origin` — прежняя копия         |

Браузер ходит только на фронтенд. `/api` проксирует `src/server.ts` (переменная `API_ORIGIN`),
поэтому CORS не мешает: серверный `fetch` и same-origin GET не шлют заголовок `Origin`, и
`FRONTEND_ORIGINS` на API не задан. Он нужен только для запросов из браузера прямо на API (dev на `:4200`).

## Что нужно знать

- **`allowedHosts` в `angular.json`** — только `localhost` и `127.0.0.1`. Для Render хост задаётся
  переменной `NG_ALLOWED_HOSTS` (Angular читает её при запуске), `angular.json` не менялся.
  Без неё SSR отклоняет запросы с чужим `Host`. Подстановка `*.onrender.com` небезопасна: SSR
  строит URL запросов к API из заголовка `Host`, нужен точный хост.
- **Диск Render free стирается** при деплое и пробуждении, а API отдаёт `/api/files/*` с диска
  (`STORAGE_DIR`). Поэтому `storage/` (~150 МБ, 296 файлов, самый большой 18 МБ) лежит в репозитории
  бэкенда.
- **Миграций «на сервере» нет**: у бесплатного Render нет ни shell, ни pre-deploy команды, поэтому
  `npm run migrate && npm run load-snapshot` выполняются в **Build Command** API.
- `load-snapshot` заливает `db/catalog-data.sql` (данные каталога на 2026-10-05, обычные
  `INSERT … jsonb_populate_recordset`) только в **пустую** базу и на непустой ничего не делает.
  Сверено на чистой БД: все 10 таблиц совпали с источником по числу строк и md5.
- `DATABASE_URL` с паролем хранится только в переменных окружения Render и не попадает ни в код,
  ни в документы. В логе сборки есть предупреждение pg про `sslmode=require`: оно безвредно, Neon
  использует валидные сертификаты.
- **Neon: только direct-строка** (хост без `-pooler`). Pooler не подходит: API передаёт
  `statement_timeout` как параметр подключения, а pooler такие параметры не принимает.

## Настройки сервисов

API (`q-trade-business`):

| Поле              | Значение                                                                            |
| ----------------- | ----------------------------------------------------------------------------------- |
| Build Command     | `npm ci --include=dev && npm run build && npm run migrate && npm run load-snapshot` |
| Start Command     | `npm run start`                                                                     |
| Health Check Path | `/api/health`                                                                       |

| Переменная     | Значение                               |
| -------------- | -------------------------------------- |
| `NODE_VERSION` | `24` (в `engines` бэкенда `>=24 <25`)  |
| `DATABASE_URL` | direct-строка Neon, `?sslmode=require` |

`PORT` Render задаёт сам, `.env` на сервере нет (бэкенд грузит его только если файл существует).

Фронтенд (`q-trade`):

| Поле          | Значение                  |
| ------------- | ------------------------- |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run serve:ssr`       |

| Переменная               | Значение                                                             |
| ------------------------ | -------------------------------------------------------------------- |
| `NODE_VERSION`           | `24`                                                                 |
| `HUSKY`                  | `0` — не ставить git-хуки при `npm ci`                               |
| `API_ORIGIN`             | `https://q-trade-business.onrender.com`                              |
| `NG_ALLOWED_HOSTS`       | `q-trade.onrender.com`; свой домен добавлять через запятую           |
| `NG_TRUST_PROXY_HEADERS` | `x-forwarded-proto,x-forwarded-port,x-forwarded-for` — `https` в SSR |

SSR-запросы к `/api` идут на публичный адрес самого фронтенда (`apiPrefixInterceptor` берёт его из
`REQUEST`) и дальше через прокси к API. Благодаря `NG_TRUST_PROXY_HEADERS` адрес в `canonical` и в
этих запросах получается с `https`.

## Проверка после деплоя

- `https://q-trade-business.onrender.com/api/health` → `{"status":"ok"}`;
  `/api/products` — 44 товара, `/api/categories` — 18 категорий, `/api/files/<хэш>.png` — фото.
- `https://q-trade.onrender.com/catalog` и `/products/xboard-v7` — SSR с данными, `canonical` с `https`,
  JSON-LD на карточке; несуществующий товар даёт 404; `/api/health` через фронтенд проходит прокси.

## Ограничения free-плана

- **Сон по цепочке: фронтенд → API → Neon.** Сервисы Render засыпают через 15 минут простоя,
  пробуждение около минуты, Neon просыпается за секунды. Прокси ждёт API 60 с (`src/server.ts`), поэтому
  первый заход после простоя долгий, но проходит. При таймауте остаётся 503 `API_UNAVAILABLE`.
  Холодный старт обоих сервисов подряд не замерялся.
- **Пинг, чтобы не засыпали, не получится держать круглосуточно:** 750 часов в месяц общие на workspace,
  два сервиса 24/7 дают ~1488. Пинг только в рабочие часы (~10 ч в день) укладывается.
- **Бесплатный Postgres Render не использовать:** удаляется через 30 дней.
- Neon free: 0.5 ГБ; каталог занимает около 11 МБ, файлы в БД не лежат.
- Для боевого сайта с клиентами free не подходит: нужны платные инстансы (на Render от ~$7 за сервис
  в месяц) и платная база либо снятие лимитов Neon.

## Обновление

- **Код:** push в `main` — Render пересоберёт и перезапустит сервис. Локальная ветка может называться
  иначе: `git push maulen <ветка>:main`.
- **Каталог:** на машине с папкой заказчика выполнить `npm run import` с `DATABASE_URL` Neon (direct),
  повторить обрезку фото (см. [backend-and-data.md](backend-and-data.md)), закоммитить `storage/` и
  запушить. Снимок `db/catalog-data.sql` на непустую базу не действует, он нужен только для первого
  деплоя. Каждая новая версия файла остаётся в истории git, репозиторий растёт.
- **Пароль базы:** Neon → Connect → Reset password у роли `neondb_owner`, затем новая direct-строка в
  `DATABASE_URL` сервиса `q-trade-business` (Environment) — Render перезапустит сервис.
