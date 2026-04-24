# ts-valify

A validation library for **TypeScript** designed for Domain-Driven Design (DDD).
**ts-valify** ensures your domain models remain valid by enforcing invariants at the moment of instantiation.

> **TypeScript Only.** This library leverages modern decorator syntax. Not compatible with plain JavaScript.

## Features

- **Constructor-Level Validation**: Automatically enforces invariants during `new` calls via `@Valified()`.
- **Zero-Inheritance**: Injects validation logic via decorators; no base classes or boilerplate needed.
- **Aggregated Errors**: Collects all validation failures across fields before throwing a single `ValifyError`.
- **DDD-Oriented Design**: Three-layer architecture: **Rules** (values), **Policies** (properties), and **Specifications** (cross-fields).
- **Recursive Validation**: Deep-scans nested `@Valified` objects with full dot-notation path reporting.
- **Explicit Validation APIs**: Use `validate()`, `validateSchema()`, and `result()` when you do not want constructor-time throws.

## Requirements

- **TypeScript ≥ 5.0**
- `tsconfig.json` configuration:
    ```json
    {
      "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
      }
    }
    ```

## Installation

```sh
npm install @tkitsunai/ts-valify
# or
pnpm add @tkitsunai/ts-valify
```

## Quick Start

```ts
import { Valified, UsePolicy, rules, ValifyError } from "@tkitsunai/ts-valify";

@Valified()
class User {
  @UsePolicy(rules.required(), rules.string(), rules.minLength(3))
  name: string;

  @UsePolicy(rules.required(), rules.number(), rules.min(0))
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

// Fails: Throws ValifyError with aggregated details
try {
  new User("ab", -1);
} catch (err) {
  if (err instanceof ValifyError) {
    console.log(err.errors);
    /* Output:
    [
      { path: "name", message: "Must be at least 3 characters" },
      { path: "age",  message: "Must be at least 0" }
    ]
    */
  }
}

// Valid - no error
const user = new User("Alice", 30);
```

## Validation Flows

- Use `new` with `@Valified()` when the object itself should enforce invariants.
- Use `valify.validateSchema()` when you want to validate multiple payloads and collect all errors before instantiation.
- Use `valify.result()` when you want to validate one payload at a time without throwing.

## Built-in Rules

```ts
rules.required(message?)
rules.string(message?)
rules.number(message?)
rules.minLength(min, message?)
rules.maxLength(max, message?)
rules.min(min, message?)
rules.max(max, message?)
rules.matches(pattern, message?)
rules.email(message?)
rules.url(message?)
rules.json(message?)
rules.alpha(message?)
rules.alphaNumeric(message?)
rules.numeric(message?)
rules.hexColor(message?)
rules.ipv4(message?)
rules.positive(message?)
rules.negative(message?)
rules.inRange(min, max, message?)
rules.date(message?)
rules.dateMin(min, message?)
rules.dateMax(max, message?)
rules.dateInRange(start, end, message?)
rules.dateFormat(format, message?)
```

### Date Rules

- `rules.date()` validates that the value is a valid date and rejects impossible dates such as `2026-02-30`.
- `rules.dateMin(min)` validates that the date is on or after the minimum date, inclusive.
- `rules.dateMax(max)` validates that the date is on or before the maximum date, inclusive.
- `rules.dateInRange(start, end)` validates that the date is within the given range, inclusive.
- `rules.dateFormat(format)` validates a date string against one of the supported formats: `"strict"` (`YYYY-MM-DD`), `"iso"` (ISO 8601 datetime), `"rfc2822"` (RFC 2822), or `"loose"` (any parseable date).

Date rules accept both `Date` objects and date strings. For `rules.dateFormat()`, `Date` objects always pass because they are already normalized values.

## Core Concepts

ts-valify separates validation into three layers so domain objects stay focused and invariants remain explicit.

1. Rule (Value Level)
The smallest validation unit. A rule checks a single value.

Purpose: determine whether the value itself is valid, for example whether a string is a valid email address.

2. Policy (Property Level)
A set of rules applied to a specific property.

Purpose: define the constraints for one field, for example required + string + minimum length.

3. Specification (Class Level)
A cross-field check spanning multiple properties.

Purpose: determine whether relationships between fields are valid, for example whether a start date is before an end date.

Usage: register specifications with the `@Satisfies(...specs)` decorator.

## Advanced Usage

### 1. Custom Rules

When the built-in `rules` are not enough, you can define your own `Rule` functions and pass them to `@UsePolicy`.

A `Rule` receives `(value, field, data)` and returns `string | null`.

#### Inline rule
```ts
import { Rule, Valified, UsePolicy } from "@tkitsunai/ts-valify";

const isEven: Rule = (value) => {
  if (typeof value !== "number" || value % 2 !== 0) return "Must be an even number";
  return null;
};

@Valified()
class Counter {
  @UsePolicy(isEven)
  count: number;

  constructor(count: number) {
    this.count = count;
  }
}
```

#### Reusable parameterized rule

```ts
const oneOf = <T>(allowed: T[], message?: string): Rule => (value) => {
  if (!allowed.includes(value as T)) {
    return message ?? `Must be one of: ${allowed.join(", ")}`;
  }
  return null;
};

@Valified()
class Order {
  @UsePolicy(oneOf(["pending", "paid", "cancelled"]))
  status: string;

  constructor(status: string) {
    this.status = status;
  }
}
```

### 2. `validateSchema()`

Use `validateSchema()` when you want to validate multiple payloads together and collect every error in a single array without instantiating classes first.

```ts
import { valify } from "@tkitsunai/ts-valify";

const input = {
  user: { name: "ab", age: -1 },
  profile: { nickname: "x", email: "bad-email" },
};

const errors = valify.validateSchema(
  {
    user: User.prototype,
    profile: Profile.prototype,
  },
  input
);

if (errors.length > 0) {
  console.log(errors);
  // [
  //   { path: "user.name", message: "..." },
  //   { path: "user.age", message: "..." },
  //   { path: "profile.nickname", message: "..." },
  //   { path: "profile.email", message: "..." },
  // ]
} else {
  const user = new User(input.user);
  const profile = new Profile(input.profile);
}
```

### 3. Schema Mode

Use schema mode when you want to validate plain objects such as API payloads or form input without instantiating a class.

Define a class without `@Valified()` and use it as a schema.

```ts
import { UsePolicy, valify, rules, Satisfies } from "@tkitsunai/ts-valify";

// Schema definition: omit @Valified() so construction-time validation is not injected.
@Satisfies((d) => d.password === d.confirm ? null : "Passwords do not match")
class SignupSchema {
  @UsePolicy(rules.required(), rules.email())
  email!: string;

  @UsePolicy(rules.required(), rules.minLength(8))
  password!: string;

  @UsePolicy(rules.required())
  confirm!: string;
}

// Validate a plain object.
const data = { email: "bad-email", password: "123", confirm: "456" };
const errors = valify.validate(SignupSchema.prototype, data);

if (errors.length > 0) {
  // Validation returns an error array instead of throwing.
  console.log(errors);
}
```

### 4. `createValidator()`

```ts
import { createValidator } from "@tkitsunai/ts-valify";

const validator = createValidator({
  stopAtFirstError: true,
  unknownObjectMode: "ignore",
});

// Retrieve a result object without throwing.
const result = validator.result(User.prototype, data);
if (!result.ok) {
  console.log(result.errors);
}

```

### 5. `result()`

Use `result()` when you want to validate one payload at a time and instantiate only the valid ones.

```ts
const userResult = valify.result(User.prototype, userData);
const profileResult = valify.result(Profile.prototype, profileData);

const user = userResult.ok ? new User(userResult.data) : null;
const profile = profileResult.ok ? new Profile(profileResult.data) : null;

const errors = [
  ...(userResult.ok ? [] : userResult.errors.map((error) => ({ ...error, path: `user.${error.path}` }))),
  ...(profileResult.ok
    ? []
    : profileResult.errors.map((error) => ({ ...error, path: `profile.${error.path}` }))),
];
```

## API Reference

### Decorators
| Decorator | Target | Description |
| :--- | :--- | :--- |
| `@Valified()` | Class | Enables automatic validation in the constructor. |
| `@UsePolicy(...rules)` | Property | Defines validation rules for a class field. It does not apply to constructor parameter properties. |
| `@Satisfies(...specs)` | Class | Registers cross-field domain specifications. |

### Factory & Validator API
The following methods are available on the default `valify` validator or on a validator created with `createValidator()`.

#### `validate(proto, data, pathPrefix?, options?)`
Validates a plain object without instantiation and returns an **array of validation errors**.
- `proto`: class prototype, for example `User.prototype`
- `data`: object to validate
- Returns: `ValidationError[]`

#### `result<T>(proto, data, pathPrefix?, options?)`
Returns the validation result as a **discriminated union**.
- Returns: `{ ok: true, data: T }` or `{ ok: false, errors: ValidationError[] }`

#### `validateSchema(schema, data, pathPrefix?, options?)`
Validates multiple keyed payloads using a `SchemaMap`.
- `schema`: map in the shape `{ key: Proto }`
- `data`: nested object in the shape `{ key: Data }`

#### `validateOrThrow(instance, options?)`
Re-validates an existing instance and throws a **`ValifyError`** if validation fails.

---

### Configuration (`ValidatorOptions`)
You can customize validation behavior through `createValidator()` or the optional `options` argument on validator methods.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `stopAtFirstError` | `boolean` | `false` | When `true`, validation stops after the first error is found. |
| `unknownObjectMode` | `"error" | "ignore"` | `"error"` | `"error"`: reject nested objects that are not marked with `@Valified`.<br>`"ignore"`: skip nested objects that are not marked with `@Valified`. |

---

### Types & Errors
| Name | Type | Description |
| :--- | :--- | :--- |
| `ValifyError` | Class | Thrown when validation fails. Detailed errors are available on `.errors`. |
| `ValifyConfigurationError` | Class | Thrown when validator setup is invalid, for example when required decorators are missing. |
| `ValidationError` | Interface | Error object in the shape `{ path: string; message: string }`. |

## Contributing

- Contribution guide: `CONTRIBUTING.md`
- Release process: `RELEASING.md`

## License

MIT