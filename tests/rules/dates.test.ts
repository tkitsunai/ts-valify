import { describe, expect, it } from "bun:test";
import { rules } from "../../src/rules";

describe("Date Rules", () => {
  describe("date", () => {
    it("passes for valid YYYY-MM-DD date string", () => {
      expect(rules.date()("2026-04-17", "d", {})).toBeNull();
    });

    it("passes for valid Date object", () => {
      expect(rules.date()(new Date("2026-04-17T00:00:00.000Z"), "d", {})).toBeNull();
    });

    it("passes for valid ISO datetime string", () => {
      expect(rules.date()("2026-04-17T10:30:00.000Z", "d", {})).toBeNull();
    });

    it("passes for valid RFC2822 datetime string", () => {
      expect(rules.date()("Fri, 17 Apr 2026 10:30:00 GMT", "d", {})).toBeNull();
    });

    it("fails for invalid date", () => {
      expect(rules.date()("2026-02-30", "d", {})).not.toBeNull();
    });

    it("fails for unparseable datetime string", () => {
      expect(rules.date()("this-is-not-a-date", "d", {})).not.toBeNull();
    });

    it("returns null for non-date values (skips)", () => {
      expect(rules.date()(123, "d", {})).toBeNull();
    });

    it("uses custom message", () => {
      expect(rules.date("Invalid date")("invalid", "d", {})).toBe("Invalid date");
    });
  });

  describe("dateMin", () => {
    it("passes for date after minimum", () => {
      expect(rules.dateMin("2026-01-01")("2026-06-17", "d", {})).toBeNull();
    });

    it("passes for date equal to minimum", () => {
      expect(rules.dateMin("2026-01-01")("2026-01-01", "d", {})).toBeNull();
    });

    it("fails for date before minimum", () => {
      expect(rules.dateMin("2026-06-01")("2026-04-17", "d", {})).not.toBeNull();
    });

    it("uses custom message", () => {
      expect(rules.dateMin("2026-06-01", "最小日付を超えています")("2026-04-17", "d", {})).toBe(
        "最小日付を超えています"
      );
    });
  });

  describe("dateMax", () => {
    it("passes for date before maximum", () => {
      expect(rules.dateMax("2026-12-31")("2026-06-17", "d", {})).toBeNull();
    });

    it("passes for date equal to maximum", () => {
      expect(rules.dateMax("2026-12-31")("2026-12-31", "d", {})).toBeNull();
    });

    it("fails for date after maximum", () => {
      expect(rules.dateMax("2026-04-01")("2026-04-17", "d", {})).not.toBeNull();
    });

    it("uses custom message", () => {
      expect(rules.dateMax("2026-04-01", "最大日付を超えています")("2026-04-17", "d", {})).toBe(
        "最大日付を超えています"
      );
    });
  });

  describe("dateInRange", () => {
    it("passes for date in range", () => {
      const inRange = "2026-06-15";
      expect(rules.dateInRange("2026-01-01", "2026-12-31")(inRange, "d", {})).toBeNull();
    });

    it("passes for boundary dates", () => {
      const rule = rules.dateInRange("2026-01-01", "2026-12-31");
      expect(rule("2026-01-01", "d", {})).toBeNull();
      expect(rule("2026-12-31", "d", {})).toBeNull();
    });

    it("fails for date outside range", () => {
      expect(rules.dateInRange("2026-01-01", "2026-12-31")("2027-01-01", "d", {})).not.toBeNull();
    });

    it("returns null for non-date values (skips)", () => {
      expect(rules.dateInRange("2026-01-01", "2026-12-31")(42, "d", {})).toBeNull();
    });

    it("uses custom message", () => {
      expect(
        rules.dateInRange("2026-01-01", "2026-12-31", "期間外です")("2027-01-01", "d", {})
      ).toBe("期間外です");
    });
  });

  describe("dateFormat", () => {
    it("passes for YYYY-MM-DD with strict format", () => {
      expect(rules.dateFormat("strict")("2026-04-17", "d", {})).toBeNull();
    });

    it("fails for ISO datetime with strict format", () => {
      expect(rules.dateFormat("strict")("2026-04-17T10:30:00.000Z", "d", {})).not.toBeNull();
    });

    it("fails for invalid YYYY-MM-DD with strict format", () => {
      expect(rules.dateFormat("strict")("2026-02-30", "d", {})).not.toBeNull();
    });

    it("passes for ISO datetime with iso format", () => {
      expect(rules.dateFormat("iso")("2026-04-17T10:30:00.000Z", "d", {})).toBeNull();
    });

    it("fails for YYYY-MM-DD with iso format", () => {
      expect(rules.dateFormat("iso")("2026-04-17", "d", {})).not.toBeNull();
    });

    it("passes for RFC2822 with rfc2822 format", () => {
      expect(rules.dateFormat("rfc2822")("Fri, 17 Apr 2026 10:30:00 GMT", "d", {})).toBeNull();
    });

    it("fails for YYYY-MM-DD with rfc2822 format", () => {
      expect(rules.dateFormat("rfc2822")("2026-04-17", "d", {})).not.toBeNull();
    });

    it("passes for any parseable date with loose format", () => {
      expect(rules.dateFormat("loose")("2026/04/17", "d", {})).toBeNull();
    });

    it("fails for unparseable with loose format", () => {
      expect(rules.dateFormat("loose")("invalid", "d", {})).not.toBeNull();
    });

    it("accepts Date objects for any format", () => {
      expect(rules.dateFormat("strict")(new Date("2026-04-17"), "d", {})).toBeNull();
      expect(rules.dateFormat("iso")(new Date("2026-04-17"), "d", {})).toBeNull();
    });

    it("uses custom message", () => {
      expect(
        rules.dateFormat("strict", "YYYY-MM-DD形式で入力してください")("2026-04-17T10:30:00.000Z", "d", {})
      ).toBe("YYYY-MM-DD形式で入力してください");
    });
  });
});
