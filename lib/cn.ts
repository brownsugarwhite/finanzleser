type ClassValue = string | number | false | null | undefined;

/** Joins class names, dropping falsy values. Tiny clsx-style utility. */
export function cn(...args: ClassValue[]): string {
  return args.filter(Boolean).join(" ");
}
