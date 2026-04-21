/** Returns whether a string satisfies the minimum length, treating empty input as skipped. */
export const isMinLength = (str: string | undefined, length: number): boolean => {
  if (!str || str.length === 0) return true;
  return str.length >= length;
};

/** Returns whether a string satisfies the maximum length, treating empty input as skipped. */
export const isMaxLength = (str: string | undefined, length: number): boolean => {
  if (!str || str.length === 0) return true;
  return str.length <= length;
};

/** Returns whether a string contains only ASCII alphabetic characters. */
export const isAlpha = (str: string): boolean => /^[a-zA-Z]+$/.test(str);

/** Returns whether a string contains only ASCII letters and digits. */
export const isAlphaNumeric = (str: string): boolean => /^[a-zA-Z0-9]+$/.test(str);

/** Returns whether a string contains only digits. */
export const isNumeric = (str: string): boolean => /^[0-9]+$/.test(str);

/** Returns whether a string is a valid 3- or 6-digit hex color code. */
export const isHexColor = (str: string): boolean => /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i.test(str);

/** Returns whether a string can be parsed as JSON. */
export const isJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/** Returns whether a string matches the library's basic email format check. */
export const isEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/** Returns whether a string matches the library's basic HTTP(S) URL format check. */
export const isUrl = (url: string): boolean => {
  const urlRegex = /^(http|https):\/\/[^ "]+$/;
  return urlRegex.test(url);
};

/** Returns whether a string is a valid IPv4 address. */
export const isIPv4 = (str: string): boolean => {
  const match = str.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  return match !== null && match.slice(1).every((x) => parseInt(x, 10) <= 255);
};


