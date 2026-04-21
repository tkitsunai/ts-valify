import { describe, expect, it } from "bun:test";
import { getPolicies, addPolicy, getSpecs, addSpec, isValified, markValified } from "../src/storage";
import { Rule, Specification } from "../src/types";

describe("Storage Module", () => {
  describe("Policy Management", () => {
    it("adds a policy and retrieves it", () => {
      const target = {};
      const mockRule: Rule = () => null;
      const field = "email";

      addPolicy(target, field, [mockRule]);
      const policies = getPolicies(target);

      expect(policies.length).toBe(1);
      expect(policies[0].field).toBe("email");
      expect(policies[0].rules.length).toBe(1);
    });

    it("adds multiple policies for different fields", () => {
      const target = {};
      const mockRule: Rule = () => null;

      addPolicy(target, "email", [mockRule]);
      addPolicy(target, "name", [mockRule, mockRule]);
      const policies = getPolicies(target);

      expect(policies.length).toBe(2);
      expect(policies[0].field).toBe("email");
      expect(policies[0].rules.length).toBe(1);
      expect(policies[1].field).toBe("name");
      expect(policies[1].rules.length).toBe(2);
    });

    it("adds multiple rules to the same field", () => {
      const target = {};
      const rule1: Rule = () => null;
      const rule2: Rule = () => "error";

      addPolicy(target, "email", [rule1, rule2]);
      const policies = getPolicies(target);

      expect(policies[0].rules.length).toBe(2);
    });

    it("returns empty array for target without policies", () => {
      const target = {};
      const policies = getPolicies(target);

      expect(policies.length).toBe(0);
    });
  });

  describe("Specification Management", () => {
    it("adds a specification and retrieves it", () => {
      const target = {};
      const mockSpec: Specification = () => null;

      addSpec(target, mockSpec);
      const specs = getSpecs(target);

      expect(specs.length).toBe(1);
      expect(specs[0]).toBe(mockSpec);
    });

    it("adds multiple specifications", () => {
      const target = {};
      const spec1: Specification = () => null;
      const spec2: Specification = () => "error";
      const spec3: Specification = () => null;

      addSpec(target, spec1);
      addSpec(target, spec2);
      addSpec(target, spec3);
      const specs = getSpecs(target);

      expect(specs.length).toBe(3);
      expect(specs[0]).toBe(spec1);
      expect(specs[1]).toBe(spec2);
      expect(specs[2]).toBe(spec3);
    });

    it("returns empty array for target without specifications", () => {
      const target = {};
      const specs = getSpecs(target);

      expect(specs.length).toBe(0);
    });
  });

  describe("Valified Marking", () => {
    it("marks a target as valified", () => {
      const target = {};

      expect(isValified(target)).toBe(false);
      markValified(target);
      expect(isValified(target)).toBe(true);
    });

    it("separate targets have independent valified status", () => {
      const target1 = {};
      const target2 = {};

      markValified(target1);

      expect(isValified(target1)).toBe(true);
      expect(isValified(target2)).toBe(false);
    });
  });

  describe("Integration: Policies and Specifications", () => {
    it("stores and retrieves both policies and specifications", () => {
      const target = {};
      const rule: Rule = () => null;
      const spec: Specification = () => null;

      addPolicy(target, "email", [rule]);
      addSpec(target, spec);

      expect(getPolicies(target).length).toBe(1);
      expect(getSpecs(target).length).toBe(1);
    });

    it("marks and stores metadata independently", () => {
      const target = {};
      const rule: Rule = () => null;

      markValified(target);
      addPolicy(target, "name", [rule]);

      expect(isValified(target)).toBe(true);
      expect(getPolicies(target).length).toBe(1);
    });
  });
});
