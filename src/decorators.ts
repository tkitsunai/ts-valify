import { valify } from "./engine";
import { addPolicy, addSpec, markValified } from "./storage";
import type { Rule, Specification } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<TInstance extends object = object> = new (...args: any[]) => TInstance;

// ─────────────────────────────────────────────
// @Valified  — Class decorator
// ─────────────────────────────────────────────

/**
 * Marks a class as a validated domain object.
 * Wraps the constructor so that `validateOrThrow` is called
 * automatically after construction.
 *
 * @returns A class decorator that validates each created instance.
 */
export function Valified(): <T extends Constructor>(target: T) => T {
  return <T extends Constructor>(Target: T): T => {
    // Register the prototype as Valified so the engine recognises it
    markValified(Target.prototype as object);

    // Proxy the constructor to run validation after the original ctor
    const Wrapped = class extends Target {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        super(...args);
        valify.validateOrThrow(this as object);
      }
    };

    // Preserve the original class name for debugging
    Object.defineProperty(Wrapped, "name", { value: Target.name });

    return Wrapped;
  };
}

// ─────────────────────────────────────────────
// @UsePolicy  — Property decorator
// ─────────────────────────────────────────────

/**
 * Registers one or more `Rule`s for the decorated property.
 * The decorator applies to class fields, not constructor parameter properties.
 *
 * @example
 * \@UsePolicy(rules.required(), rules.minLength(3))
 * name!: string;
 *
 * @param policyRules - Rules to evaluate for the decorated property.
 * @returns A property decorator.
 */
export function UsePolicy(...policyRules: Rule[]): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    addPolicy(target, String(propertyKey), policyRules);
  };
}

// ─────────────────────────────────────────────
// @Satisfies  — Class decorator for cross-field specs
// ─────────────────────────────────────────────

/**
 * Registers a `Specification` (cross-field predicate) on the class.
 *
 * @example
 * \@Satisfies(data => data.end > data.start ? null : "end must be after start")
 * \@Valified()
 * class DateRange { ... }
 *
 * @param specs - Specifications to evaluate after field-level rules.
 * @returns A class decorator.
 */
export function Satisfies(
  ...specs: Specification[]
): (target: Constructor) => void {
  return (target: Constructor): void => {
    for (const spec of specs) {
      addSpec(target.prototype as object, spec);
    }
  };
}
