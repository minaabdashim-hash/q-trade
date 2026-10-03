# Архитектура фронтенда

Angular 22, standalone-компоненты, zoneless-стиль работы на signals, SSR с рендером на каждый запрос.

## Карта каталогов

```
src/
├── app/
│   ├── app.ts / app.html        оболочка: шапка, <router-outlet>, футер, cookie-бар, тосты
│   ├── app.config.ts            провайдеры браузера: роутер, HttpClient, гидратация
│   ├── app.config.server.ts     + provideServerRendering(withRoutes(serverRoutes))
│   ├── app.routes.ts            все маршруты, каждый через loadComponent
│   ├── app.routes.server.ts     режим рендера SSR (сейчас Server для всех путей)
│   ├── core/                    ничего не рисует: данные, HTTP, сквозные сервисы
│   │   ├── models/              типы DTO + чистые функции (categoryPath, totalPages, toCartItem)
│   │   ├── services/            ApiService, ProductService, SeoService, AuthService, …
│   │   ├── interceptors/        apiPrefix, error (+ неиспользуемый auth)
│   │   └── guards/              authGuard, adminGuard — пока не навешаны ни на один роут
│   ├── features/                страницы, по одной папке на раздел
│   │   ├── home/                главная: статический маркетинговый контент
│   │   ├── products/            каталог, категория, карточка товара, заглушки устройств
│   │   └── auth/                вход и заявка на аккаунт (бэкенда пока нет)
│   ├── layout/header.ts         шапка + мегаменю, строится из категорий API
│   └── shared/                  переиспользуемые мелочи: ui/, pipes/
├── environments/                apiUrl, валюта, локаль; подмена файла в dev-конфигурации
├── server.ts                    Express: прокси /api → бэкенд, статика, Angular SSR
└── styles.css                   токены Tailwind v4 и базовые стили
```

Правило слоёв: `features` и `layout` зависят от `core` и `shared`; `core` не знает о страницах;
`shared` не знает ни о чём, кроме себя.

## Маршруты

| Путь                            | Компонент                               | Примечание                                                     |
| ------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `/`                             | `features/home/home.ts`                 | Контент захардкожен в компоненте, API не вызывает              |
| `/catalog`                      | `features/products/product-category.ts` | Все опубликованные товары и корневые категории                 |
| `/catalog/:slug`                | тот же компонент                        | Категория, её подкатегории и товары всей ветки                 |
| `/products/:slug`               | `features/products/product-detail.ts`   | Карточка: модель `?model=`, галерея, характеристики, документы |
| `/auth/login`, `/auth/register` | `features/auth/auth-page.ts`            | Режим приходит через `data: { mode }`                          |

Параметры маршрута приходят в компонент как входы: включён `withComponentInputBinding()`,
поэтому `readonly slug = input.required<string>()` заполняется из `:slug` автоматически.
Фильтры, сортировка и страница живут в query-параметрах URL — ссылка на выдачу воспроизводима.

## Поток данных

```
Компонент ──rxResource──► ProductService ──► ApiService ──► HttpClient
                                                              │
                                   apiPrefixInterceptor ──────┤  '/products' → environment.apiUrl + путь
                                   errorInterceptor ──────────┘  тост + проброс ошибки
                                                              │
                     dev: http://localhost:3000/api ◄──────────┘
                     prod: /api → Express (src/server.ts) → API_ORIGIN
```

- `ApiService` — тонкая типизированная обёртка над `HttpClient`; `toHttpParams` выбрасывает
  пустые значения, чтобы URL оставался чистым.
- `ProductService` держит сигнал языка `language` и общий ресурс `categoryList`
  (`rxResource`), который перезапрашивается при смене RU/KZ. Меню и хлебные крошки читают его.
- Страницы создают свои `rxResource` на `params` из входов и сигналов, поэтому запрос
  повторяется сам при смене slug, языка или query-параметров.
- `apiErrorStatus(error)` достаёт HTTP-статус из ошибки ресурса — так отличается 404 от прочих сбоев.

## Рендеринг на сервере

- `app.routes.server.ts`: `RenderMode.Server` для `**`. Пререндера нет — опубликованный товар
  появляется при следующем запросе без пересборки.
- `src/server.ts` поднимает Express: сначала прокси `/api`, затем статика `dist/browser`,
  затем Angular SSR. Прокси пропускает только `GET/HEAD/OPTIONS` (иначе 405), ставит
  `Cache-Control: no-store`, таймаут 10 с, при сбое отдаёт 503 `API_UNAVAILABLE`.
- `apiPrefixInterceptor` на сервере через `inject(REQUEST)` превращает относительный `/api/...`
  в абсолютный URL — иначе SSR-запрос некуда отправлять.
- Страницы задают HTTP-статус ответа через `inject(RESPONSE_INIT)`: несуществующий товар
  отдаёт 404, а не 200 с текстом «не найдено».
- `StorageService` на сервере возвращает `null` и не пишет — поэтому `localStorage` можно
  вызывать из любого сервиса без проверок платформы.

## Состояние

Отдельного стора нет. Используются:

- сигналы внутри компонентов (открытое меню, развёрнутые характеристики);
- `rxResource` для серверных данных (`value()`, `hasValue()`, `error()`, `isLoading()`);
- URL как источник фильтров каталога;
- `@ngrx/signals` подключён и используется только в неактивном `CartStore`.

## SEO

`SeoService` ставит title/description/OG/canonical и JSON-LD. Карточка товара вызывает
`setProductStructuredData`; при пустой цене предложение в разметке не выдумывается.
Там, где данных нет (рейтинги, отзывы), структурированные данные не добавляются — это
проверяется тестом в `features/products/catalog.spec.ts`.
