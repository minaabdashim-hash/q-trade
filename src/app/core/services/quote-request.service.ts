import { Injectable, signal } from '@angular/core';

/** Opens the single quote-request dialog that the app shell mounts. */
@Injectable({ providedIn: 'root' })
export class QuoteRequestService {
  readonly open = signal(false);
  /** Product the visitor asked about; empty for a general request. */
  readonly subject = signal('');

  show(subject = ''): void {
    this.subject.set(subject);
    this.open.set(true);
  }
}
