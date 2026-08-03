/**
 * cn() — the ONLY correct way to merge classes in a component that accepts a
 * `className` prop.
 *
 * Why not plain clsx(): clsx concatenates, so `px-4` and `px-8` both survive
 * and the winner is decided by CSS source order, not argument order. Callers
 * think they are overriding and are not. twMerge resolves the conflict.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
