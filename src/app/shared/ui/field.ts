import type { AbstractControl } from '@angular/forms';

// Borderless field on a light-grey fill; the label rests inside and floats up once the field is
// focused or filled (`placeholder=" "` lets CSS tell empty from filled). Used by the quote dialog
// and the B2B shop forms.
export const FIELD =
  'peer w-full rounded-xl bg-surface-alt px-4 pt-6 pb-2 text-[0.95rem] text-fg ring-primary ' +
  'outline-none transition-colors placeholder:text-transparent focus:bg-surface focus:ring-2 ' +
  'focus:placeholder:text-fg-muted aria-invalid:ring-2 aria-invalid:ring-danger';

export const FIELD_LABEL =
  'text-fg-muted pointer-events-none absolute top-4 left-4 text-[0.95rem] transition-all ' +
  'peer-focus:top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 ' +
  'peer-[:not(:placeholder-shown)]:text-xs';

/** `aria-invalid` drives the red ring, and only after the visitor has touched the field. */
export const fieldInvalid = (control: AbstractControl): true | null =>
  control.invalid && control.touched ? true : null;
