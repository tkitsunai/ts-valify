// ─────────────────────────────────────────────
// Validation types
// ─────────────────────────────────────────────

/**
 * A Rule is a function that validates a single field value.
 *
 * @param value - The field value being validated.
 * @param field - The field name currently being evaluated.
 * @param data - The full object being validated.
 * @returns `null` when valid, or an error message string when invalid.
 */
export type Rule = (
  value: unknown,
  field: string,
  data: Record<string, unknown>
) => string | null;

/**
 * A Specification is a predicate on the whole record.
 *
 * @param data - The full object being validated.
 * @returns `null` when satisfied, or an error message when not.
 */
export type Specification = (data: Record<string, unknown>) => string | null;


// ─────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────

/** A single validation failure with its path and human-readable message. */
export interface ValidationError {
  /** Dot-notation path to the invalid field, or `*` for specification errors. */
  path: string;

  /** Human-readable validation message. */
  message: string;
}

/** Error thrown when validation finds one or more domain invariant violations. */
export class ValifyError extends Error {
  /**
   * @param errors - All validation errors collected during evaluation.
   */
  constructor(public readonly errors: ValidationError[]) {
    super(`Validation failed:\n${errors.map((e) => `  [${e.path}] ${e.message}`).join("\n")}`);
    this.name = "ValifyError";
  }
}

/** Error thrown when validation metadata or configuration is inconsistent. */
export class ValifyConfigurationError extends Error {
  /**
   * @param message - Description of the invalid configuration.
   */
  constructor(message: string) {
    super(message);
    this.name = "ValifyConfigurationError";
  }
}
