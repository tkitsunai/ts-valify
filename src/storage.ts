import type { Rule, Specification } from "./types";

// ─────────────────────────────────────────────
// Internal Symbol keys
// ─────────────────────────────────────────────

const POLICIES_KEY = Symbol("valify:policies");
const SPECS_KEY = Symbol("valify:specs");
const VALIFIED_KEY = Symbol("valify:valified");

// ─────────────────────────────────────────────
// Types for stored metadata
// ─────────────────────────────────────────────

/** Registered rule set for a single property. */
export interface PolicyEntry {
  /** Property name the policy applies to. */
  field: string;

  /** Rules evaluated for the property in registration order. */
  rules: Rule[];
}

interface MetadataCarrier {
  [POLICIES_KEY]?: PolicyEntry[];
  [SPECS_KEY]?: Specification[];
  [VALIFIED_KEY]?: boolean;
}

// ─────────────────────────────────────────────
// Storage API
// ─────────────────────────────────────────────

/** Returns the mutable policy registry for the given prototype. */
export function getPolicies(target: object): PolicyEntry[] {
  const proto = target as MetadataCarrier;
  if (!proto[POLICIES_KEY]) proto[POLICIES_KEY] = [];
  return proto[POLICIES_KEY];
}

/** Adds one or more rules to a property policy on the given prototype. */
export function addPolicy(target: object, field: string, rules: Rule[]): void {
  const policies = getPolicies(target);
  const existing = policies.find((p) => p.field === field);
  if (existing) {
    existing.rules.push(...rules);
  } else {
    policies.push({ field, rules });
  }
}

/** Returns the mutable specification registry for the given prototype. */
export function getSpecs(target: object): Specification[] {
  const proto = target as MetadataCarrier;
  if (!proto[SPECS_KEY]) proto[SPECS_KEY] = [];
  return proto[SPECS_KEY];
}

/** Adds a cross-field specification to the given prototype. */
export function addSpec(target: object, spec: Specification): void {
  getSpecs(target).push(spec);
}

/** Marks a prototype so nested validation can recognize it as a valified object. */
export function markValified(target: object): void {
  (target as MetadataCarrier)[VALIFIED_KEY] = true;
}

/** Returns whether a prototype has been marked as `@Valified()`. */
export function isValified(target: object): boolean {
  return !!(target as MetadataCarrier)[VALIFIED_KEY];
}
