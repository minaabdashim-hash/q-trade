# Деплой: Render + Neon (бесплатные планы)

Схема для пилота и демо. Статус: **инструкция, сам деплой ещё не выполнялся**. Лимиты бесплатных
планов меняются — перед запуском сверьте их на сайтах Render и Neon.

```
Браузер ─► Render: фронтенд (Angular SSR, Node) ─/api─► Render: API (Express) ─► Neon (PostgreSQL)
                                                          └─ фото и PDF из storage/ (лежат в git)
```

Браузер ходит только на фронтенд. `/api` проксирует `src/server.ts` (переменная `API_ORIGIN`),
поэтому CORS не мешает: серверный `fetch` и same-origin GET не шлют заголовок `Origin`.

## Что нужно знать заранее

- **`allowedHosts` в `angular.json`** — только `localhost` и `127.0.0.1`. Для Render хост задаётся
  переменной `NG_ALLOWED_HOSTS` (Angular читает её при запуске), править `angular.json` не нужно.
- **Диск Render free стирается** при деплое и пробуждении, а API отдаёт `/api/files/*` с диска
  (`STORAGE_DIR`). Поэтому `storage/` (~150 МБ, 296 файлов, самый большой 18 МБ) коммитится
  в репозиторий бэкенда: строку `storage/` из его `.gitignore` убрать.
- **Бэкенд — отдельный репозиторий** `Q-trade-business`, у обоих проектов нужен remote на GitHub.
- **Миграций на сервере нет**: у бесплатного Render нет ни shell, ни pre-deploy команды.
  Схема и данные попадают в Neon дампом с локальной машины.

## 1. Neon

1. Создать проект в регионе Render (Frankfurt). Версия Postgres — та же, что локально (18), если
   доступна, иначе 17.
2. В **Connect** выключить _Connection pooling_ и взять **direct**-строку (хост без `-pooler`,
   `?sslmode=require`). Pooler не подходит: API передаёт `statement_timeout` как параметр
   подключения, а pooler такие параметры не принимает.
3. Залить локальную базу (Git Bash, из `Q-trade-business`; логин и имя БД — из локального `.env`):

```bash
docker compose exec -T postgres sh -c 'pg_dump -U q_trade --no-owner --no-privileges q_trade_catalog | psql "$0"' "NEON_DIRECT_URL"
```

В дамп входят схема, данные и таблица `pgmigrations`, `npm run migrate` не нужен.
**Не использовать `npm run import` для первичной заливки**: он кладёт в `storage/` необрезанные
фото, и хэши в БД разойдутся с обрезанными файлами (см. [backend-and-data.md](backend-and-data.md)).

Лимит Neon free — 0.5 ГБ; файлы в БД не лежат, каталог должен уместиться (проверять в консоли Neon).
Вычисления засыпают при простое — первый запрос медленнее.

## 2. Render: API (`q-trade-business`)

| Поле              | Значение                                |
| ----------------- | --------------------------------------- |
| Region            | Frankfurt (как Neon)                    |
| Build Command     | `npm ci --include=dev && npm run build` |
| Start Command     | `npm start`                             |
| Instance Type     | Free                                    |
| Health Check Path | `/api/health`                           |

| Переменная         | Значение                                                       |
| ------------------ | -------------------------------------------------------------- |
| `NODE_VERSION`     | `24` (в `engines` бэкенда `>=24 <25`)                          |
| `DATABASE_URL`     | direct-строка Neon                                             |
| `FRONTEND_ORIGINS` | `https://<front>.onrender.com` — точный origin, без `/` и пути |

`PORT` Render задаёт сам, `.env` на сервере нет (бэкенд грузит его только если файл существует).

## 3. Render: фронтенд (`q-trade`)

| Поле          | Значение                  |
| ------------- | ------------------------- |
| Region        | Frankfurt                 |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run serve:ssr`       |
| Instance Type | Free                      |

| Переменная               | Значение                                                                          |
| ------------------------ | --------------------------------------------------------------------------------- |
| `NODE_VERSION`           | `24`                                                                              |
| `HUSKY`                  | `0` — не ставить git-хуки при `npm ci`                                            |
| `API_ORIGIN`             | `https://<api>.onrender.com` — публичный URL API-сервиса                          |
| `NG_ALLOWED_HOSTS`       | `<front>.onrender.com`, свой домен — через запятую                                |
| `NG_TRUST_PROXY_HEADERS` | `x-forwarded-host,x-forwarded-proto` — необязательно; даёт `https` в SSR-запросах |

SSR-запросы к `/api` идут на публичный адрес самого фронтенда (`apiPrefixInterceptor` берёт его из
`REQUEST`) и дальше через прокси к API. Если Angular ругается на `NG_TRUST_PROXY_HEADERS`, переменную
можно убрать: Render сам редиректит `http` на `https`.

Адрес `<front>` известен после создания сервиса: сначала создать, затем добавить `NG_ALLOWED_HOSTS`
и вписать адрес в `FRONTEND_ORIGINS` API.

## 4. Проверка

- `https://<api>.onrender.com/api/health` → `{"status":"ok"}` (первый запрос после сна — около минуты).
- `https://<api>.onrender.com/api/products` отдаёт товары, `/api/files/<хэш>.png` — фото.
- `https://<front>.onrender.com/catalog` — каталог с фото.

## Ограничения free-плана

- **Сон по цепочке: фронтенд → API → Neon.** Сервисы Render засыпают через 15 минут простоя,
  пробуждение около минуты. Прокси ждёт API 60 с (`src/server.ts`), поэтому первый заход после простоя
  долгий, но проходит. При таймауте остаётся 503 `API_UNAVAILABLE`.
- **Пинг, чтобы не засыпали, не получится держать круглосуточно:** 750 часов в месяц общие на workspace,
  два сервиса 24/7 дают ~1488. Пинг только в рабочие часы (~10 ч в день) укладывается.
- **Бесплатный Postgres Render не использовать:** удаляется через 30 дней.
- **Сборка Angular на 512 МБ** может упасть по памяти — тогда собирать в GitHub Actions или брать
  платный инстанс.
- Для боевого сайта с клиентами free не подходит: нужны платные инстансы (на Render от ~$7 за сервис
  в месяц) и платная база либо снятие лимитов Neon.

## Обновление каталога

После нового `npm run import` повторить обрезку фото (см. [backend-and-data.md](backend-and-data.md)),
закоммитить `storage/` в репозиторий бэкенда (Render пересоберёт API) и перелить БД дампом, как в п. 1.
Каждая новая версия файла остаётся в истории git, репозиторий растёт.
