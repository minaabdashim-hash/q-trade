import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

type Device = 'panel' | 'led' | 'bar' | 'speaker';

// ponytail: static content from the design mock, move to the admin/API when it can drive the home page.
const TILES: {
  title: string;
  subtitle: string;
  links: string[];
  dark: boolean;
  device: Device;
  tall: boolean;
}[] = [
  {
    title: 'Для образования',
    subtitle: 'Панели B5 и F5. Урок, который хочется слушать.',
    links: ['Подробнее', 'Решения для школ'],
    dark: false,
    device: 'panel',
    tall: true,
  },
  {
    title: 'LED-экраны',
    subtitle: 'Raptor V3. Конференц-зал без границ.',
    links: ['Подробнее'],
    dark: true,
    device: 'led',
    tall: true,
  },
  {
    title: 'XBar W70',
    subtitle: 'Видеобар для средних комнат.',
    links: [],
    dark: true,
    device: 'bar',
    tall: false,
  },
  {
    title: 'Спикерфоны BM45',
    subtitle: 'Каждое слово — чётко.',
    links: [],
    dark: false,
    device: 'speaker',
    tall: false,
  },
];

const ROOMS = [
  { name: 'Open space', size: '2–4 чел.' },
  { name: 'Малая', size: '3–7 чел.' },
  { name: 'Средняя', size: '8–12 чел.' },
  { name: 'Signature', size: '6–10 чел.' },
  { name: 'Большая', size: 'до 20 чел.' },
];

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
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  protected readonly tiles = TILES;
  protected readonly rooms = ROOMS;
  protected readonly stats = STATS;
  protected readonly projects = PROJECTS;
  protected readonly roomTypes = ROOM_TYPES;

  // ponytail: lead delivery (CRM + Telegram) is not wired yet.
  protected submit(event: Event): void {
    event.preventDefault();
  }

  constructor() {
    inject(SeoService).setPageMeta({
      title: 'Meeting room hardware',
      description:
        'Q-Trade builds touch panels, displays and unified communication for meeting rooms.',
      path: '/',
    });
  }
}
