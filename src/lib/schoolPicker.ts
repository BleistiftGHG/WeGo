import type { Place } from '@/lib/nearby';

type Listener = (place: Place) => void;

let listener: Listener | null = null;

export function onSchoolPicked(next: Listener) {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

export function emitSchoolPicked(place: Place) {
  listener?.(place);
}