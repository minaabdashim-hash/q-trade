import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { ProductVisual } from '../products/product-card';

type Device = 'panel' | 'led' | 'bar' | 'speaker';

const SLIDE_MS = 6000;
// ponytail: slogans are copy from the design mock and the product summaries; photos come from the API by slug.
const SLIDES = [
  {
    slug: 'xboard-v7-mtr',
    category: 'xboard',
    eyebrow: 'Новинка',
    title: 'XBoard V7 MTR',
    subtitle: 'Вся переговорная — в одном экране.',
  },
  {
    slug: 'xboard-v7',
    category: 'xboard',
    eyebrow: 'Для переговорных',
    title: 'XBoard V7',
    subtitle: 'Тройная камера 50 Мп и 16 микрофонов.',
  },
  {
    slug: 'u4-series',
    category: 'education',
    eyebrow: 'Для образования',
    title: 'U4 Series',
    subtitle: 'Панель для классов на Android 15.',
  },
  {
    slug: 'e3-series',
    category: 'education',
    eyebrow: 'Для образования',
    title: 'E3 Series',
    subtitle: '4K, 40 касаний и акустика 2.2.',
  },
];

// ponytail: static content from the design mock, move to the admin/API when it can drive the home page.
const TILES: {
  slug: string;
  title: string;
  subtitle: string;
  links: string[];
  dark: boolean;
  device: Device;
  tall: boolean;
}[] = [
  {
    slug: 'education',
    title: 'Для образования',
    subtitle: 'Панели B5 и F5. Урок, который хочется слушать.',
    links: ['Подробнее', 'Решения для школ'],
    dark: false,
    device: 'panel',
    tall: true,
  },
  {
    slug: 'led',
    title: 'LED-экраны',
    subtitle: 'Raptor V3. Конференц-зал без границ.',
    links: ['Подробнее'],
    dark: true,
    device: 'led',
    tall: true,
  },
  {
    slug: 'xbar',
    title: 'XBar W70',
    subtitle: 'Видеобар для средних комнат.',
    links: [],
    dark: true,
    device: 'bar',
    tall: false,
  },
  {
    slug: 'speakerphone',
    title: 'Спикерфоны BM45',
    subtitle: 'Каждое слово — чётко.',
    links: [],
    dark: false,
    device: 'speaker',
    tall: false,
  },
];

type RoomSize = 'small' | 'medium' | 'large';
type Platform = 'windows' | 'android';

const ROOMS: { key: RoomSize; name: string }[] = [
  { key: 'small', name: 'Малая' },
  { key: 'medium', name: 'Средняя' },
  { key: 'large', name: 'Большая' },
];
const PLATFORMS: { key: Platform; name: string }[] = [
  { key: 'windows', name: 'Windows' },
  { key: 'android', name: 'Android' },
];
// ponytail: kits follow the "для малых / средних / больших комнат" wording of the product summaries
// (the catalog has no capacities); move to an API tag when the data has one.
const KITS: Record<RoomSize, Record<Platform, string[]>> = {
  small: { windows: ['xt20-vb-kit'], android: ['xbar-v50-kit-android'] },
  medium: {
    windows: ['xt20-vb-kit', 'xbar-w70-kit-windows', 'xt20-ps-kit'],
    android: ['xbar-v50-kit-android', 'xbar-v70-kit-android'],
  },
  large: {
    windows: ['xbar-w70-kit-windows', 'xt20-ps-kit'],
    android: ['xbar-v70-kit-android'],
  },
};

// ponytail: sample figures from the mock, replace with real ones from the customer.
const STATS = [
  { value: '3 года', label: 'официальной гарантии' },
  { value: '120+', label: 'проектов в Казахстане' },
  { value: '14', label: 'городов с партнёрами' },
  { value: '48 ч', label: 'на сервисный выезд' },
];

const PROJECTS = [
  {
    place: 'Алматы · Банк',
    title: '12 переговорных Teams Rooms',
    bg: 'from-[#efe9de] to-[#b9a58c]',
  },
  {
    place: 'Астана · Университет',
    title: '80 аудиторий с панелями B5',
    bg: 'from-[#8fc79a] to-[#5aa070]',
  },
  {
    place: 'Шымкент · Акимат',
    title: 'LED-стена 5×3 м в зале',
    bg: 'from-[#ff9a2e] via-[#e5502e] to-[#4b2bb8]',
  },
];

const ROOM_TYPES = ['Переговорная', 'Класс / аудитория', 'Зал', 'Другое'];

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductVisual],
  templateUrl: './home.html',
})
export class Home {
  private readonly service = inject(ProductService);
  /** Tile photos come from the category list the header already loads; no photo keeps the CSS device. */
  protected readonly tiles = computed(() => {
    const categories = this.service.categoryList.hasValue()
      ? this.service.categoryList.value()
      : [];
    const images = new Map(categories.map((category) => [category.slug, category.imageUrl]));
    return TILES.map((tile) => ({ ...tile, image: images.get(tile.slug) ?? null }));
  });
  protected readonly rooms = ROOMS;
  protected readonly platforms = PLATFORMS;
  protected readonly size = signal<RoomSize>('medium');
  protected readonly platform = signal<Platform>('windows');
  // ponytail: one request for the whole catalog (API cap is 60 per page); slides and kits pick by slug.
  protected readonly catalog = rxResource({
    params: () => this.service.language(),
    stream: ({ params }) => this.service.list({ page: 1, size: 60, lang: params }),
  });
  private readonly products = computed(() =>
    this.catalog.hasValue() ? this.catalog.value().items : [],
  );
  protected readonly shown = computed(() =>
    KITS[this.size()][this.platform()].flatMap((slug) =>
      this.products().filter((item) => item.slug === slug),
    ),
  );
  /** Slides with a photo in the catalog; until it loads, the first slide keeps its local poster. */
  protected readonly slides = computed(() => {
    const bySlug = new Map(this.products().map((item) => [item.slug, item]));
    const found = SLIDES.flatMap((slide) => {
      const image = bySlug.get(slide.slug)?.images[0]?.url;
      return image ? [{ ...slide, image }] : [];
    });
    return found.length ? found : [{ ...SLIDES[0], image: '/xboard-v7-mtr.png' }];
  });
  private readonly slide = signal(0);
  protected readonly current = computed(() => this.slide() % this.slides().length);
  protected readonly paused = signal(false);
  /** Pointer or keyboard focus is on the hero: do not move the slide under the visitor. */
  protected readonly held = signal(false);
  protected readonly stats = STATS;
  protected readonly projects = PROJECTS;
  protected readonly roomTypes = ROOM_TYPES;

  // ponytail: lead delivery (CRM + Telegram) is not wired yet.
  protected submit(event: Event): void {
    event.preventDefault();
  }

  protected go(index: number): void {
    const count = this.slides().length;
    this.slide.set(((index % count) + count) % count);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) this.paused.set(true);
      const timer = setInterval(() => {
        if (!this.paused() && !this.held()) this.go(this.current() + 1);
      }, SLIDE_MS);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
    inject(SeoService).setPageMeta({
      title: 'Meeting room hardware',
      description:
        'Q-Trade builds touch panels, displays and unified communication for meeting rooms.',
      path: '/',
    });
  }
}
