import type { Rule } from "../types";
import {
  isMinLength,
  isMaxLength,
  isEmail,
  isUrl,
  isAlpha,
  isAlphaNumeric,
  isNumeric,
  isHexColor,
  isJSON,
  isIPv4,
} from "./strings";
import { isPositive, isNegative, isInsideRange } from "./number";
import {
  isInsideRange as isDateInsideRange,
  isValidDate,
  isDateMin,
  isDateMax,
  isDateFormatValid,
  type DateFormat,
} from "./date";

// ─────────────────────────────────────────────
// Built-in Rules
// ─────────────────────────────────────────────

/** Collection of built-in rule factories for field-level validation. */
export const rules = {
  /**
   * Field must be present (not undefined, null, or empty string).
   */
  required(message = "This field is required"): Rule {
    return (value) => {
      if (value === undefined || value === null || value === "") {
        return message;
      }
      return null;
    };
  },

  /**
   * Value must be a string.
   */
  string(message = "Must be a string"): Rule {
    return (value) => (typeof value === "string" ? null : message);
  },

  /**
   * Value must be a number.
   */
  number(message = "Must be a number"): Rule {
    return (value) => (typeof value === "number" ? null : message);
  },

  /**
   * String must meet the minimum length.
   */
  minLength(min: number, message?: string): Rule {
    return (value) => {
      if (typeof value !== "string") return null; // let string() handle type errors
      return isMinLength(value, min) ? null : message ?? `Must be at least ${min} characters`;
    };
  },

  /**
   * String must not exceed the maximum length.
   */
  maxLength(max: number, message?: string): Rule {
    return (value) => {
      if (typeof value !== "string") return null;
      return isMaxLength(value, max) ? null : message ?? `Must be at most ${max} characters`;
    };
  },

  /**
   * Number/string must be >= min.
   */
  min(min: number, message?: string): Rule {
    return (value) => {
      if (typeof value !== "number") return null;
      if (value < min) return message ?? `Must be at least ${min}`;
      return null;
    };
  },

  /**
   * Number must be <= max.
   */
  max(max: number, message?: string): Rule {
    return (value) => {
      if (typeof value !== "number") return null;
      if (value > max) return message ?? `Must be at most ${max}`;
      return null;
    };
  },

  /**
   * String must match the pattern.
   */
  matches(pattern: RegExp, message = "Invalid format"): Rule {
    return (value) => {
      if (typeof value !== "string") return null;
      return pattern.test(value) ? null : message;
    };
  },

  /**
   * String must be a valid email address.
   */
  email(message = "Must be a valid email"): Rule {
    return (value) => {
      if (typeof value !== "string") return null;
      return isEmail(value) ? null : message;
    };
  },

  /**
   * String must be a valid URL.
   */
  url(message = "Must be a valid URL"): Rule {
    return (value) => {
      if (typeof value !== "string") return null;
      return isUrl(value) ? null : message;
    };
  },

  /**
   * String must be valid JSON.
   */
  json(message = "Must be valid JSON"): Rule {
    return (value) => {
      if (typeof value !== "string") return null;
      return isJSON(value) ? null : message;
    };
  },

  /**
   * String must contain only alphabetic characters.
   */
  alpha(message = "Must contain only alphabetic characters"): Rule {
    return (value) => {
      if (typeof value !== "string") return null;
      return isAlpha(value) ? null : message;
    };
  },

  /**
   * String must be alphanumeric (letters and numbers only).
   */
  alphaNumeric(message = "Must be alphanumeric"): Rule {
    return (value) => {
      if (typeof value !== "string") return null;
      return isAlphaNumeric(value) ? null : message;
    };
  },

  /**
   * String must contain only numeric characters (digits).
   */
  numeric(message = "Must contain only numeric characters"): Rule {
    return (value) => {
      if (typeof value !== "string") return null;
      return isNumeric(value) ? null : message;
    };
  },

  /**
   * String must be a valid hex color code.
   */
  hexColor(message = "Must be a valid hex color"): Rule {
    return (value) => {
      if (typeof value !== "string") return null;
      return isHexColor(value) ? null : message;
    };
  },

  /**
   * String must be a valid IPv4 address.
   */
  ipv4(message = "Must be a valid IPv4 address"): Rule {
    return (value) => {
      if (typeof value !== "string") return null;
      return isIPv4(value) ? null : message;
    };
  },

  /**
   * Number must be positive (> 0).
   */
  positive(message = "Must be a positive number"): Rule {
    return (value) => {
      if (typeof value !== "number") return null;
      return isPositive(value) ? null : message;
    };
  },

  /**
   * Number must be negative (< 0).
   */
  negative(message = "Must be a negative number"): Rule {
    return (value) => {
      if (typeof value !== "number") return null;
      return isNegative(value) ? null : message;
    };
  },

  /**
   * Number must be within a specified range (inclusive).
   */
  inRange(min: number, max: number, message?: string): Rule {
    return (value) => {
      if (typeof value !== "number") return null;
      return isInsideRange({ value, range: { start: min, end: max } })
        ? null
        : message ?? `Must be between ${min} and ${max}`;
    };
  },

  /**
   * Value must be a valid date string or Date object.
   */
  date(message = "Must be a valid date"): Rule {
    return (value) => {
      if (!(typeof value === "string" || value instanceof Date)) return null;
      return isValidDate(value) ? null : message;
    };
  },

  /**
   * Date must be on or after the minimum date (inclusive).
   */
  dateMin(min: string | Date, message?: string): Rule {
    return (value) => {
      if (!(typeof value === "string" || value instanceof Date)) return null;
      return isDateMin(value, min) ? null : message ?? "Must be after or on the minimum date";
    };
  },

  /**
   * Date must be on or before the maximum date (inclusive).
   */
  dateMax(max: string | Date, message?: string): Rule {
    return (value) => {
      if (!(typeof value === "string" || value instanceof Date)) return null;
      return isDateMax(value, max) ? null : message ?? "Must be before or on the maximum date";
    };
  },

  /**
   * Date must be within a specified range (inclusive).
   */
  dateInRange(start: string | Date, end: string | Date, message?: string): Rule {
    return (value) => {
      if (!(typeof value === "string" || value instanceof Date)) return null;
      return isDateInsideRange(value, start, end)
        ? null
        : message ?? "Must be within the allowed date range";
    };
  },

  /**
   * Date string must match the specified format.
   */
  dateFormat(format: DateFormat, message?: string): Rule {
    return (value) => {
      if (!(typeof value === "string" || value instanceof Date)) return null;
      const formatName = format === "strict" ? "YYYY-MM-DD" : format.toUpperCase();
      return isDateFormatValid(value, format)
        ? null
        : message ?? `Must be in ${formatName} format`;
    };
  },
};
