import { Injectable, inject, signal } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

export type NotificationKind = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  kind: NotificationKind;
  text: string;
}

const AUTO_DISMISS_MS = 4500;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly announcer = inject(LiveAnnouncer);
  private nextId = 0;

  private readonly items = signal<Notification[]>([]);
  readonly notifications = this.items.asReadonly();

  success(text: string): void {
    this.push('success', text);
  }

  error(text: string): void {
    this.push('error', text);
  }

  info(text: string): void {
    this.push('info', text);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((n) => n.id !== id));
  }

  private push(kind: NotificationKind, text: string): void {
    const id = this.nextId++;
    this.items.update((list) => [...list, { id, kind, text }]);
    this.announcer.announce(text, kind === 'error' ? 'assertive' : 'polite');
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}
