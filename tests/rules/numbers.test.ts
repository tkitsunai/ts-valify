import { describe, expect, it } from "bun:test";
import { rules } from "../../src/rules";

describe("Number Rules", () => {
  describe("positive", () => {
    it("passes for positive number", () => {
      const positiveRule = rules.positive();
      expect(positiveRule(5, "age", {})).toBeNull();
    });

    it("fails for zero", () => {
      const positiveRule = rules.positive();
      expect(positiveRule(0, "age", {})).not.toBeNull();
    });

    it("fails for negative number", () => {
      const positiveRule = rules.positive();
      expect(positiveRule(-5, "age", {})).not.toBeNull();
    });

    it("returns null for non-number values (skips)", () => {
      expect(rules.positive()("5", "age", {})).toBeNull();
    });

    it("uses custom error message", () => {
      expect(rules.positive("正の数でなければなりません")(0, "age", {})).toBe(
        "正の数でなければなりません"
      );
    });
  });

  describe("negative", () => {
    it("passes for negative number", () => {
      const negativeRule = rules.negative();
      expect(negativeRule(-5, "balance", {})).toBeNull();
    });

    it("fails for positive number", () => {
      const negativeRule = rules.negative();
      expect(negativeRule(5, "balance", {})).not.toBeNull();
    });

    it("fails for zero", () => {
      const negativeRule = rules.negative();
      expect(negativeRule(0, "balance", {})).not.toBeNull();
    });

    it("returns null for non-number values (skips)", () => {
      expect(rules.negative()("-5", "balance", {})).toBeNull();
    });
  });

  describe("inRange", () => {
    it("passes for number within range", () => {
      const inRangeRule = rules.inRange(1, 10);
      expect(inRangeRule(5, "score", {})).toBeNull();
    });

    it("passes for number at range boundaries", () => {
      const inRangeRule = rules.inRange(1, 10);
      expect(inRangeRule(1, "score", {})).toBeNull();
      expect(inRangeRule(10, "score", {})).toBeNull();
    });

    it("fails for number below range", () => {
      const inRangeRule = rules.inRange(1, 10);
      expect(inRangeRule(0, "score", {})).not.toBeNull();
    });

    it("fails for number above range", () => {
      const inRangeRule = rules.inRange(1, 10);
      expect(inRangeRule(11, "score", {})).not.toBeNull();
    });

    it("returns null for non-number values (skips)", () => {
      expect(rules.inRange(1, 10)("5", "score", {})).toBeNull();
    });

    it("uses custom error message", () => {
      expect(rules.inRange(1, 10, "1〜10の範囲で入力してください")(0, "score", {})).toBe(
        "1〜10の範囲で入力してください"
      );
    });
  });

  describe("min", () => {
    it("passes for number >= min", () => {
      const minRule = rules.min(5);
      expect(minRule(10, "age", {})).toBeNull();
    });

    it("passes for number exactly equal to min", () => {
      const minRule = rules.min(5);
      expect(minRule(5, "age", {})).toBeNull();
    });

    it("fails for number < min", () => {
      const minRule = rules.min(5);
      expect(minRule(3, "age", {})).not.toBeNull();
    });

    it("returns null for non-number values (skips)", () => {
      const minRule = rules.min(5);
      expect(minRule("10", "age", {})).toBeNull();
    });

    it("uses custom error message", () => {
      expect(rules.min(5, "5以上でなければなりません")(3, "age", {})).toBe(
        "5以上でなければなりません"
      );
    });
  });

  describe("max", () => {
    it("passes for number <= max", () => {
      const maxRule = rules.max(10);
      expect(maxRule(5, "age", {})).toBeNull();
    });

    it("passes for number exactly equal to max", () => {
      const maxRule = rules.max(10);
      expect(maxRule(10, "age", {})).toBeNull();
    });

    it("fails for number > max", () => {
      const maxRule = rules.max(10);
      expect(maxRule(15, "age", {})).not.toBeNull();
    });

    it("returns null for non-number values (skips)", () => {
      const maxRule = rules.max(10);
      expect(maxRule("5", "age", {})).toBeNull();
    });

    it("uses custom error message", () => {
      expect(rules.max(10, "10以下でなければなりません")(15, "age", {})).toBe(
        "10以下でなければなりません"
      );
    });
  });
});
