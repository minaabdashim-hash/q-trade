import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { StorageService } from './core/services/storage.service';
import { Header } from './layout/header';
import { Icon } from './shared/ui/icon';
import { QuoteDialog } from './shared/ui/quote-dialog';
import { ToastHost } from './shared/ui/toast-host';

const COOKIE_KEY = 'qt.cookie-consent';

// ponytail: placeholder contacts from the mock, replace with the real address and phone.
const FOOTER_COLUMNS = [
  { title: 'Продукты', items: ['Панели', 'ВКС', 'LED'] },
  { title: 'Решения', items: ['Teams Rooms', 'Образование'] },
  { title: 'Поддержка', items: ['Гарантия', 'Загрузки'] },
  { title: 'Компания', items: ['О нас', 'Контакты'] },
  { title: 'Связаться', items: ['+7 7XX XXX XX XX', 'Алматы, ул. …'] },
];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, Header, ToastHost, QuoteDialog, Icon],
  templateUrl: './app.html',
})
export class App {
  protected readonly footerColumns = FOOTER_COLUMNS;
  private readonly storage = inject(StorageService);

  protected readonly showCookieNotice = signal(!this.storage.read<boolean>(COOKIE_KEY));

  protected dismissCookieNotice(): void {
    this.storage.write(COOKIE_KEY, true);
    this.showCookieNotice.set(false);
  }
}
