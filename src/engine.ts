import { getPolicies, getSpecs, isValified } from "./storage";
import { type ValidationError, ValifyConfigurationError, ValifyError } from "./types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const PRIMITIVES = new Set(["string", "number", "boolean", "bigint", "symbol", "undefined"]);

/** Returns whether a value should be treated as a scalar leaf during traversal. */
function isPrimitive(value: unknown): boolean {
  return PRIMITIVES.has(typeof value) || value === null;
}

/** Returns whether a value is a `Date` instance. */
function isDate(value: unknown): boolean {
  return value instanceof Date;
}

/** Returns whether a value is an array. */
function isArray(value: unknown): boolean {
  return Array.isArray(value);
}

/** Strategy used when nested objects are not marked with `@Valified()`. */
export type UnknownObjectMode = "error" | "ignore";

/** Optional settings that control validator traversal behavior. */
export interface ValidatorOptions {
  /** Stop evaluating as soon as the first error is found. */
  stopAtFirstError?: boolean;

  /** How to handle nested non-primitive objects without `@Valified()`. */
  unknownObjectMode?: UnknownObjectMode;
}

interface ResolvedValidatorOptions {
  stopAtFirstError: boolean;
  unknownObjectMode: UnknownObjectMode;
}

/** Successful or failed validation result returned by `result()`. */
export type ValidationResult<T extends Record<string, unknown>> =
  | { ok: true; data: T }
  | { ok: false; errors: ValidationError[] };

/** Public validator interface implemented by `valify` and `createValidator()`. */
export interface Validator {
  /** Validates plain data against the policies registered on a prototype. */
  validate(
    proto: object,
    data: Record<string, unknown>,
    pathPrefix?: string,
    options?: ValidatorOptions
  ): ValidationError[];

  /** Validates multiple keyed payloads against a schema map. */
  validateSchema(
    schema: SchemaMap,
    data: Record<string, Record<string, unknown>>,
    pathPrefix?: string,
    options?: ValidatorOptions
  ): ValidationError[];

  /** Re-validates an existing instance and throws when validation fails. */
  validateOrThrow(instance: object, options?: ValidatorOptions): void;

  /** Returns a discriminated union instead of throwing. */
  result<T extends Record<string, unknown>>(
    proto: object,
    data: T,
    pathPrefix?: string,
    options?: ValidatorOptions
  ): ValidationResult<T>;
}

// ─────────────────────────────────────────────
// Core recursive scan
// ─────────────────────────────────────────────

/**
 * Recursively validates `data` against the policies registered on `proto`.
 * Returns a flat list of ValidationErrors (never throws by itself).
 */
function scan(
  proto: object,
  data: Record<string, unknown>,
  pathPrefix: string,
  options: ResolvedValidatorOptions
): ValidationError[] {
  const errors: ValidationError[] = [];
  const policies = getPolicies(proto);
  const specs = getSpecs(proto);

  for (const { field, rules } of policies) {
    const value = data[field];
    const path = pathPrefix ? `${pathPrefix}.${field}` : field;

    // Run scalar rules
    for (const rule of rules) {
      const msg = rule(value, field, data);
      if (msg !== null) {
        errors.push({ path, message: msg });
        if (options.stopAtFirstError) {
          return errors;
        }
      }
    }

    // Recurse into nested objects
    if (
      !isPrimitive(value) &&
      !isDate(value) &&
      !isArray(value) &&
      value !== null &&
      value !== undefined
    ) {
      const nested = value as Record<string, unknown>;
      // Find the prototype of the nested value to check for @Valified
      const nestedProto = Object.getPrototypeOf(nested) as object | null;
      if (nestedProto && isValified(nestedProto)) {
        const nestedErrors = scan(nestedProto, nested, path, options);
        errors.push(...nestedErrors);
        if (options.stopAtFirstError && errors.length > 0) {
          return errors;
        }
      } else {
        if (options.unknownObjectMode === "error") {
          // Strict Mode: unknown objects without @Valified are not allowed
          throw new ValifyConfigurationError(
            `Property "${path}" is an object without a @Valified decorator. ` +
              `Either add @Valified to its class or declare it as a primitive.`
          );
        }
      }
    }
  }

  // Run cross-field specifications
  for (const spec of specs) {
    const msg = spec(data);
    if (msg !== null) {
      const path = pathPrefix ? `${pathPrefix}.*` : "*";
      errors.push({ path, message: msg });
      if (options.stopAtFirstError) {
        return errors;
      }
    }
  }

  return errors;
}

// ─────────────────────────────────────────────
// Public Engine API
// ─────────────────────────────────────────────

/** Map of schema keys to the prototypes used to validate each keyed payload. */
export type SchemaMap = Record<string, object>;

const DEFAULT_OPTIONS: ResolvedValidatorOptions = {
  stopAtFirstError: false,
  unknownObjectMode: "error",
};

/** Applies default values to optional validator settings. */
function resolveOptions(options?: ValidatorOptions): ResolvedValidatorOptions {
  return {
    stopAtFirstError: options?.stopAtFirstError ?? DEFAULT_OPTIONS.stopAtFirstError,
    unknownObjectMode: options?.unknownObjectMode ?? DEFAULT_OPTIONS.unknownObjectMode,
  };
}

/**
 * Creates a validator instance with optional default settings.
 *
 * @param baseOptions - Default options applied to every validation call made by the instance.
 * @returns A validator with `validate`, `validateSchema`, `validateOrThrow`, and `result` methods.
 */
export function createValidator(baseOptions?: ValidatorOptions): Validator {
  const base = resolveOptions(baseOptions);

  const merge = (options?: ValidatorOptions): ResolvedValidatorOptions => ({
    stopAtFirstError: options?.stopAtFirstError ?? base.stopAtFirstError,
    unknownObjectMode: options?.unknownObjectMode ?? base.unknownObjectMode,
  });

  const validate: Validator["validate"] = (proto, data, pathPrefix = "", options) => {
    return scan(proto, data, pathPrefix, merge(options));
  };

  const validateSchema: Validator["validateSchema"] = (schema, data, pathPrefix = "", options) => {
    const resolved = merge(options);
    const errors: ValidationError[] = [];
    for (const key of Object.keys(schema)) {
      const proto = schema[key];
      const value = data[key];
      const path = pathPrefix ? `${pathPrefix}.${key}` : key;
      if (value === undefined || value === null) {
        errors.push({ path, message: "Value is required" });
        if (resolved.stopAtFirstError) {
          return errors;
        }
        continue;
      }
      errors.push(...scan(proto, value, path, resolved));
      if (resolved.stopAtFirstError && errors.length > 0) {
        return errors;
      }
    }
    return errors;
  };

  const validateOrThrow: Validator["validateOrThrow"] = (instance, options) => {
    const proto = Object.getPrototypeOf(instance) as object;
    const data = instance as Record<string, unknown>;
    const errors = scan(proto, data, "", merge(options));
    if (errors.length > 0) {
      throw new ValifyError(errors);
    }
  };

  const result: Validator["result"] = (proto, data, pathPrefix = "", options) => {
    const errors = validate(proto, data, pathPrefix, options);
    if (errors.length === 0) {
      return { ok: true, data };
    }
    return { ok: false, errors };
  };

  return {
    validate,
    validateSchema,
    validateOrThrow,
    result,
  };
}

/** Default validator instance configured with the library defaults. */
export const valify = createValidator();
