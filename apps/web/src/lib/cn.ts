export type ClassValue = string | number | false | null | undefined;

/**
 * Join conditional class names.
 *
 * Deliberately tiny: the design system needs conditionals and optional
 * overrides, not a class-merging engine. Tailwind conflicts are avoided by
 * composing variants in one place (`buttonStyles`, `badgeStyles`) rather than
 * appending arbitrary utilities from call sites.
 */
export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];

  for (const value of values) {
    if (value === undefined || value === null || value === false || value === '') {
      continue;
    }
    classes.push(String(value));
  }

  return classes.join(' ');
}
