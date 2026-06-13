import { clsx, type ClassValue } from "clsx";

/** Tiny class-name combiner used across the component library. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
