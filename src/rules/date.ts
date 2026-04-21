/**
 * Supported date format types.
 */
export type DateFormat = "strict" | "iso" | "rfc2822" | "loose";

/** Accepted input type for the date rule helpers. */
export type DateLike = string | Date;

/**
 * Normalizes a value to a Date object, or returns null if the value is invalid.
 *
 * @param value - The input value to normalize.
 * @param allowedFormats - Allowed date formats. If omitted, all supported formats are accepted.
 * @returns A `Date` object if the value is valid, otherwise `null`.
 */
export function normalizeToDate(
  value: DateLike,
  allowedFormats?: DateFormat[]
): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  // If specific formats are allowed, check format first
  if (allowedFormats && allowedFormats.length > 0) {
    // Check strict format
    if (allowedFormats.includes("strict")) {
      const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateOnly) {
        const year = Number(dateOnly[1]);
        const month = Number(dateOnly[2]);
        const day = Number(dateOnly[3]);
        const normalized = new Date(Date.UTC(year, month - 1, day));

        if (
          normalized.getUTCFullYear() === year &&
          normalized.getUTCMonth() + 1 === month &&
          normalized.getUTCDate() === day
        ) {
          return normalized;
        }
      }
    }

    // Check ISO format
    if (allowedFormats.includes("iso")) {
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (isoRegex.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Check RFC2822 format
    if (allowedFormats.includes("rfc2822")) {
      const rfc2822Regex = /^\w+,\s+\d{1,2}\s+\w+\s+\d{4}\s+\d{2}:\d{2}:\d{2}/;
      if (rfc2822Regex.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Check loose format
    if (allowedFormats.includes("loose")) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }

    // If no format matched, return null
    return null;
  }

  // Default: allow strict + ISO + RFC2822 + loose (backwards compatibility)
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const normalized = new Date(Date.UTC(year, month - 1, day));

    if (
      normalized.getUTCFullYear() === year &&
      normalized.getUTCMonth() + 1 === month &&
      normalized.getUTCDate() === day
    ) {
      return normalized;
    }
    // If it matches YYYY-MM-DD but validation fails, return null (don't try other formats)
    return null;
  }

  // Try ISO format
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  if (isoRegex.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try RFC2822 format
  const rfc2822Regex = /^\w+,\s+\d{1,2}\s+\w+\s+\d{4}\s+\d{2}:\d{2}:\d{2}/;
  if (rfc2822Regex.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Last resort: loose parsing (but validate it doesn't jump dates)
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Checks whether the given value can be normalized into a valid date.
 *
 * @param value - The date string or `Date` object to validate.
 * @param allowedFormats - Allowed date formats.
 * @returns `true` if the value is a valid date, otherwise `false`.
 */
export function isValidDate(value: DateLike, allowedFormats?: DateFormat[]): boolean {
  return normalizeToDate(value, allowedFormats) !== null;
}

/**
 * Checks if a given date is within a specified range (inclusive).
 *
 * @param value - The date string or `Date` object to validate.
 * @param start - The start of the date range, inclusive.
 * @param end - The end of the date range, inclusive.
 * @param allowedFormats - Allowed date formats.
 * @returns `true` if the date is within the range, otherwise `false`.
 */
export function isInsideRange(
  value: DateLike,
  start: DateLike,
  end: DateLike,
  allowedFormats?: DateFormat[]
): boolean {
  const date = normalizeToDate(value, allowedFormats);
  const startDate = normalizeToDate(start, allowedFormats);
  const endDate = normalizeToDate(end, allowedFormats);
  if (!date || !startDate || !endDate) return false;
  return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime();
}

/**
 * Checks if a given date is on or after the minimum date (inclusive).
 *
 * @param value - The date string or `Date` object to validate.
 * @param min - The minimum date, inclusive.
 * @param allowedFormats - Allowed date formats.
 * @returns `true` if the date is on or after `min`, otherwise `false`.
 */
export function isDateMin(
  value: DateLike,
  min: DateLike,
  allowedFormats?: DateFormat[]
): boolean {
  const date = normalizeToDate(value, allowedFormats);
  const minDate = normalizeToDate(min, allowedFormats);
  if (!date || !minDate) return false;
  return date.getTime() >= minDate.getTime();
}

/**
 * Checks if a given date is on or before the maximum date (inclusive).
 *
 * @param value - The date string or `Date` object to validate.
 * @param max - The maximum date, inclusive.
 * @param allowedFormats - Allowed date formats.
 * @returns `true` if the date is on or before `max`, otherwise `false`.
 */
export function isDateMax(
  value: DateLike,
  max: DateLike,
  allowedFormats?: DateFormat[]
): boolean {
  const date = normalizeToDate(value, allowedFormats);
  const maxDate = normalizeToDate(max, allowedFormats);
  if (!date || !maxDate) return false;
  return date.getTime() <= maxDate.getTime();
}

/**
 * Checks if a given date string matches the specified format.
 *
 * @param value - The date string or `Date` object to validate.
 * @param format - The required date format.
 * @returns `true` if the value matches the format, otherwise `false`.
 */
export function isDateFormatValid(value: DateLike, format: DateFormat): boolean {
  if (value instanceof Date) {
    return true; // Date objects are format-agnostic
  }

  if (typeof value !== "string") return false;

  switch (format) {
    case "strict":
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && normalizeToDate(value, ["strict"]) !== null;
    case "iso":
      return (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) &&
        normalizeToDate(value, ["iso"]) !== null
      );
    case "rfc2822":
      return (
        /^\w+,\s+\d{1,2}\s+\w+\s+\d{4}\s+\d{2}:\d{2}:\d{2}/.test(value) &&
        normalizeToDate(value, ["rfc2822"]) !== null
      );
    case "loose":
      return normalizeToDate(value, ["loose"]) !== null;
    default:
      return false;
  }
}
