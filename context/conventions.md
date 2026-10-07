# Соглашения, команды и подводные камни

## Команды

```powershell
npm ci                 # установка
npm start              # dev-сервер http://localhost:4200 (нужен запущенный бэкенд на :3000)
npm run build          # сборка браузера и SSR в dist/q-trade
npm run serve:ssr      # запуск собранного SSR, порт PORT (по умолчанию 4000)
npm run test:ci        # vitest без watch
npm run lint           # ESLint по src/**/*.ts и *.html
npm run format         # prettier --write .
```

Перед `serve:ssr` указать, куда проксировать API: `$env:API_ORIGIN = 'http://localhost:3000'`.
Бэкенд поднимается из `../Q-trade-business`: `npm run db:up`, `npm run migrate`, `npm run import`, `npm run dev`.

## Код

- Только **standalone**-компоненты, `changeDetection: ChangeDetectionStrategy.OnPush` везде.
- Зависимости через `inject()`, не через конструктор.
- Реактивность на сигналах: `signal`, `computed`, `input()`/`input.required()`, `output()`;
  серверные данные — `rxResource`. `effect` — только для побочных действий (SEO, статус ответа).
- Шаблоны: управляющий синтаксис `@if` / `@for` / `@switch` / `@let`; `*ngIf` и `*ngFor` не используются.
- Крупные шаблоны выносятся в `.html` рядом с компонентом, мелкие остаются инлайном.
- Имена файлов — kebab-case без суффикса `.component` (`product-card.ts`, `product-detail.html`).
- Доменные типы и чистые функции живут в `core/models`, а не в компонентах.
- Текст интерфейса — русский; идентификаторы, комментарии и коммиты — английский.
- Комментарии объясняют «почему», а не пересказывают код. Метка `ponytail:` помечает осознанное
  упрощение с описанием потолка и пути развития — такие места трогать осознанно.

## Стили

Tailwind v4 без конфиг-файла: всё в `src/styles.css` через `@theme`. В разметке — семантические
классы (`bg-surface-alt`, `text-fg-muted`), произвольные значения `[#hex]` только там, где цвет
не входит в палитру. `prettier-plugin-tailwindcss` сам сортирует классы — порядок руками не править.

## Проверки

- Тесты: vitest через `@angular/build:unit-test`, файлы `*.spec.ts` рядом с кодом.
  Основной набор — [`features/products/catalog.spec.ts`](../src/app/features/products/catalog.spec.ts):
  иерархия категорий и защита от циклов, DTO и язык запросов, пустые изображения и цены,
  ссылки на карточку, расчёты корзины, structured data без выдуманных предложений и рейтингов.
- Husky: `pre-commit` → `lint-staged` (eslint --fix + prettier), `commit-msg` → commitlint.
- Коммиты — Conventional Commits, scope из списка в `commitlint.config.cjs`
  (`core`, `shared`, `home`, `catalog`, `product`, `cart`, `checkout`, `auth`, `ci`, `deps`).
- `npm run lint` проходит без ошибок — держать так.
- B2B вручную: `npm run b2b:user` и `npm run demo-prices` в `../Q-trade-business`, вход на `/auth/login`
  (данные демо-аккаунта — в README бэкенда).

## Подводные камни

- **Файлы в `public/` подхватываются только при старте dev-сервера.** Добавили картинку —
  перезапустите `npm start`, иначе 404.
- **SSR-DOM (domino) умеет не всё.** Уже обожглись: `innerHTML` на SVG-элементе, `document.baseURI`,
  `dataset` на `documentElement` — всё бросает `NotYetImplemented`. Писать атрибуты через
  `setAttribute`, собирать SVG строкой и вставлять в HTML-элемент.
- **Относительные URL на сервере не работают.** `apiPrefixInterceptor` поэтому дополняет путь
  до абсолютного через `inject(REQUEST)`.
- **Пустые данные — норма.** Цен и остатков в каталоге нет, как и KZ-текстов и связей между товарами.
  Любая вёрстка обязана переживать `images: []`, `price: null`, `stockQuantity: null`, пустые `models[].documents`.
- **Картинка выглядит мелкой — смотри на пустые поля в самом файле**, а не на размер блока:
  фото не растягиваются выше естественного размера, а ширину ограничивает карточка. Лечится обрезкой
  файла в `Q-trade-business/storage` (см. [backend-and-data.md](backend-and-data.md)).
- **Бэкенд на `:3000` при превью.** Фронтенд из превью (`autoPort`) живёт на случайном порту, а CORS
  бэкенда разрешает только `:4200` (`FRONTEND_ORIGINS`) — запросы с другого порта получают 403
  и в интерфейсе «Failed to fetch». Для проверки с данными используй сервер на `:4200`.
- **Порт 4200 часто занят** параллельной сессией; в `.claude/launch.json` включён `autoPort`,
  поэтому превью может подняться на случайном порту.
- **`allowedHosts`** в `angular.json` ограничен `localhost` и `127.0.0.1` — для доступа с другого
  хоста список надо расширить осознанно.
- Prettier приводит переводы строк к LF, Git на Windows может показывать предупреждение о CRLF —
  это ожидаемо, не «сломанные» файлы.

## Чего не делать

- Не возвращать мок-API и демо-товары: каталог живёт на реальных данных.
- Не подставлять нули вместо `null` в цене и остатке, не придумывать рейтинги, отзывы и скидки.
- Не плодить абстракции под будущие разделы: решения и проекты появятся вместе со своими данными.
- Не менять DTO во фронтенде в отрыве от `../Q-trade-business/API_CONTRACT.md`.
