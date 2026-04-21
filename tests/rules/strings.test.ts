import { describe, expect, it } from "bun:test";
import { rules } from "../../src/rules";

describe("Core Rules", () => {
  describe("required", () => {
    it("passes for a non-empty string", () => {
      expect(rules.required()("hello", "field", {})).toBeNull();
    });

    it("passes for a number value", () => {
      expect(rules.required()(0, "field", {})).toBeNull();
    });

    it("fails for undefined", () => {
      expect(rules.required()(undefined, "field", {})).not.toBeNull();
    });

    it("fails for null", () => {
      expect(rules.required()(null, "field", {})).not.toBeNull();
    });

    it("fails for empty string", () => {
      expect(rules.required()("", "field", {})).not.toBeNull();
    });

    it("uses custom error message", () => {
      expect(rules.required("必須項目です")(undefined, "field", {})).toBe("必須項目です");
    });
  });

  describe("string", () => {
    it("passes for a string value", () => {
      expect(rules.string()("hello", "field", {})).toBeNull();
    });

    it("fails for a number", () => {
      expect(rules.string()(42, "field", {})).not.toBeNull();
    });

    it("fails for null", () => {
      expect(rules.string()(null, "field", {})).not.toBeNull();
    });

    it("uses custom error message", () => {
      expect(rules.string("文字列でなければなりません")(42, "field", {})).toBe(
        "文字列でなければなりません"
      );
    });
  });

  describe("number", () => {
    it("passes for a number value", () => {
      expect(rules.number()(42, "field", {})).toBeNull();
    });

    it("passes for 0", () => {
      expect(rules.number()(0, "field", {})).toBeNull();
    });

    it("fails for a string", () => {
      expect(rules.number()("42", "field", {})).not.toBeNull();
    });

    it("uses custom error message", () => {
      expect(rules.number("数値でなければなりません")("abc", "field", {})).toBe(
        "数値でなければなりません"
      );
    });
  });

  describe("matches", () => {
    it("passes when value matches pattern", () => {
      expect(rules.matches(/^\d{3}$/)("123", "field", {})).toBeNull();
    });

    it("fails when value does not match pattern", () => {
      expect(rules.matches(/^\d{3}$/)("abc", "field", {})).not.toBeNull();
    });

    it("returns null for non-string values (skips)", () => {
      expect(rules.matches(/^\d+$/)(123, "field", {})).toBeNull();
    });

    it("uses custom error message", () => {
      expect(rules.matches(/^\d+$/, "数字のみ")("abc", "field", {})).toBe("数字のみ");
    });
  });
});

describe("String Rules", () => {
  describe("email", () => {
    it("passes for valid email", () => {
      const emailRule = rules.email();
      expect(emailRule("test@example.com", "email", {})).toBeNull();
    });

    it("fails for invalid email", () => {
      const emailRule = rules.email();
      expect(emailRule("invalid-email", "email", {})).not.toBeNull();
    });

    it("returns null for non-string values", () => {
      const emailRule = rules.email();
      expect(emailRule(123, "email", {})).toBeNull();
    });
  });

  describe("url", () => {
    it("passes for valid URL", () => {
      const urlRule = rules.url();
      expect(urlRule("https://example.com", "url", {})).toBeNull();
    });

    it("fails for invalid URL", () => {
      const urlRule = rules.url();
      expect(urlRule("not a url", "url", {})).not.toBeNull();
    });
  });

  describe("json", () => {
    it("passes for valid JSON", () => {
      const jsonRule = rules.json();
      expect(jsonRule('{"key": "value"}', "json", {})).toBeNull();
    });

    it("fails for invalid JSON", () => {
      const jsonRule = rules.json();
      expect(jsonRule("{invalid json}", "json", {})).not.toBeNull();
    });
  });

  describe("alpha", () => {
    it("passes for alphabetic string", () => {
      const alphaRule = rules.alpha();
      expect(alphaRule("abcDEF", "alpha", {})).toBeNull();
    });

    it("fails for non-alphabetic string", () => {
      const alphaRule = rules.alpha();
      expect(alphaRule("abc123", "alpha", {})).not.toBeNull();
    });
  });

  describe("alphaNumeric", () => {
    it("passes for alphanumeric string", () => {
      const alphaNumericRule = rules.alphaNumeric();
      expect(alphaNumericRule("abc123", "alphaNumeric", {})).toBeNull();
    });

    it("fails for non-alphanumeric string", () => {
      const alphaNumericRule = rules.alphaNumeric();
      expect(alphaNumericRule("abc-123", "alphaNumeric", {})).not.toBeNull();
    });
  });

  describe("numeric", () => {
    it("passes for numeric string", () => {
      const numericRule = rules.numeric();
      expect(numericRule("12345", "numeric", {})).toBeNull();
    });

    it("fails for non-numeric string", () => {
      const numericRule = rules.numeric();
      expect(numericRule("123abc", "numeric", {})).not.toBeNull();
    });

    it("returns null for non-string values (skips)", () => {
      const numericRule = rules.numeric();
      expect(numericRule(123, "numeric", {})).toBeNull();
    });

    it("uses custom error message", () => {
      const numericRule = rules.numeric("数字のみ");
      expect(numericRule("abc", "numeric", {})).toBe("数字のみ");
    });
  });

  describe("hexColor", () => {
    it("passes for valid hex color", () => {
      const hexColorRule = rules.hexColor();
      expect(hexColorRule("#FF5733", "hexColor", {})).toBeNull();
    });

    it("passes for hex color without hash", () => {
      const hexColorRule = rules.hexColor();
      expect(hexColorRule("FF5733", "hexColor", {})).toBeNull();
    });

    it("fails for invalid hex color", () => {
      const hexColorRule = rules.hexColor();
      expect(hexColorRule("not-a-color", "hexColor", {})).not.toBeNull();
    });
  });

  describe("ipv4", () => {
    it("passes for valid IPv4", () => {
      const ipv4Rule = rules.ipv4();
      expect(ipv4Rule("192.168.1.1", "ipv4", {})).toBeNull();
    });

    it("fails for invalid IPv4", () => {
      const ipv4Rule = rules.ipv4();
      expect(ipv4Rule("999.999.999.999", "ipv4", {})).not.toBeNull();
    });
  });

  describe("minLength", () => {
    it("passes for string meeting minimum length", () => {
      const minLengthRule = rules.minLength(3);
      expect(minLengthRule("abc", "field", {})).toBeNull();
    });

    it("fails for string below minimum length", () => {
      const minLengthRule = rules.minLength(3);
      expect(minLengthRule("ab", "field", {})).not.toBeNull();
    });
  });

  describe("maxLength", () => {
    it("passes for string within maximum length", () => {
      const maxLengthRule = rules.maxLength(5);
      expect(maxLengthRule("abc", "field", {})).toBeNull();
    });

    it("fails for string exceeding maximum length", () => {
      const maxLengthRule = rules.maxLength(5);
      expect(maxLengthRule("abcdef", "field", {})).not.toBeNull();
    });
  });
});
