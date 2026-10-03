const BASE =
  'block bg-gradient-to-b from-[#3d3d42] to-[#0e0e10] shadow-[0_0.3em_0.5em_-0.15em_rgba(0,0,0,0.45)] ';

// Sized in em: the container's font-size scales the whole shape.
const SHAPES: Record<string, string> = {
  'uc-xbar': 'h-[0.22em] w-[2.8em] rounded-full',
  'uc-xcore': 'h-[0.75em] w-[1.7em] rounded-[0.12em]',
  'uc-console': 'h-[0.6em] w-[1.1em] rounded-[0.1em] -skew-x-6',
  'uc-camera': 'size-[0.85em] rounded-full',
  'uc-speaker': 'h-[0.8em] w-[1.5em] rounded-[50%]',
  'uc-mic': 'h-[1em] w-[0.14em] rounded-full',
};
const GENERIC = 'h-[1em] w-[1.8em] rounded-[0.1em] border-[0.06em] border-[#2b2b2f]';

/** Neutral stand-in for a product photo, picked by category id. */
export function deviceShape(categoryId: string): string {
  return BASE + (SHAPES[categoryId] ?? GENERIC);
}
