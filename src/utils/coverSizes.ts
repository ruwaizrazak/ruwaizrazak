/** One `sizes` entry: an optional media condition and the slot's CSS width in that range. */
export interface SizeSlot {
  media?: string;
  width: string;
}

// LEARN: object-fit: cover scales a wide image to the box HEIGHT, so it draws wider than its slot;
// `sizes` must name that drawn width or the browser picks a file too small for the screen.
export function coverSizes(slots: SizeSlot[], boxAspect: number, width: number, height: number): string {
  const scale = Math.max(1, Math.ceil((width / height / boxAspect) * 100) / 100);
  return slots
    .map(({ media, width: slot }) => {
      const value = scale === 1 ? slot : `calc(${slot} * ${scale})`;
      return media ? `${media} ${value}` : value;
    })
    .join(', ');
}
