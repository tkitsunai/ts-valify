import { describe, expect, test } from "bun:test";
import * as valifyModule from "../src/index";
import {
  createValidator,
  rules,
  Satisfies,
  UsePolicy,
  Valified,
  valify,
  ValifyConfigurationError,
  ValifyError,
} from "../src/index";

// ─────────────────────────────────────────────
// Domain models used across test cases
// ─────────────────────────────────────────────

@Valified()
class Address {
  @UsePolicy(rules.required(), rules.string(), rules.minLength(2))
  city!: string;

  @UsePolicy(rules.required(), rules.string())
  country!: string;

  constructor(data: Partial<Address>) {
    Object.assign(this, data);
  }
}

@Valified()
class User {
  @UsePolicy(rules.required(), rules.string(), rules.minLength(3))
  name!: string;

  @UsePolicy(rules.required(), rules.number(), rules.min(0))
  age!: number;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }
}

@Valified()
class UserWithAddress {
  @UsePolicy(rules.required(), rules.string(), rules.minLength(3))
  name!: string;

  @UsePolicy(rules.required())
  address!: Address;

  constructor(data: Partial<UserWithAddress>) {
    Object.assign(this, data);
  }
}

@Valified()
class Profile {
  @UsePolicy(rules.required(), rules.string(), rules.minLength(2))
  nickname!: string;

  @UsePolicy(
    rules.required(),
    rules.string(),
    rules.matches(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i)
  )
  email!: string;

  constructor(data: Partial<Profile>) {
    Object.assign(this, data);
  }
}

// ─────────────────────────────────────────────
// Case 1: Constructor Invariants
// ─────────────────────────────────────────────

describe("Case 1: Constructor Invariants", () => {
  test("throws ValifyError immediately when data is invalid", () => {
    expect(() => new User({ name: "ab", age: -5 })).toThrow(ValifyError);
  });

  test("aggregates ALL errors in a single throw", () => {
    try {
      new User({ name: "ab", age: -5 });
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ValifyError);
      const e = err as ValifyError;
      // expects two errors: name too short AND age below min
      expect(e.errors.length).toBe(2);
    }
  });

  test("does not throw when data is valid", () => {
    expect(() => new User({ name: "Alice", age: 30 })).not.toThrow();
  });

  test("missing required field is caught", () => {
    expect(() => new User({ age: 20 } as Partial<User>)).toThrow(ValifyError);
  });
});

// ─────────────────────────────────────────────
// Case 2: Nested Object Path Generation
// ─────────────────────────────────────────────

describe("Case 2: Nested pathing", () => {
  test("reports address.city in the error path", () => {
    // Build a plain object whose prototype IS Address.prototype so the engine
    // recognises it as a @Valified nested object.
    const shortCity = Object.assign(Object.create(Address.prototype) as Address, {
      city: "X",
      country: "JP",
    });

    const errors = valify.validate(UserWithAddress.prototype, {
      name: "Alice",
      address: shortCity,
    });
    const paths = errors.map((e) => e.path);
    expect(paths).toContain("address.city");
  });

  test("nested valid object has no errors", () => {
    const validAddress = Object.assign(Object.create(Address.prototype) as Address, {
      city: "Tokyo",
      country: "JP",
    });
    const errors = valify.validate(UserWithAddress.prototype, {
      name: "Alice",
      address: validAddress,
    });
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// Case 3: Multi-payload validation without instantiation
// ─────────────────────────────────────────────

describe("Case 3: Multi-payload validation", () => {
  test("public API no longer exports ValifyCollector", () => {
    expect("ValifyCollector" in valifyModule).toBe(false);
  });

  test("validateSchema aggregates errors across multiple payloads", () => {
    const errors = valify.validateSchema(
      { user: User.prototype, profile: Profile.prototype },
      {
        user: { name: "ab", age: -1 },
        profile: { nickname: "x", email: "bad-email" },
      }
    );

    expect(errors).toHaveLength(4);
    expect(errors.map((error) => error.path)).toEqual(
      expect.arrayContaining(["user.name", "user.age", "profile.nickname", "profile.email"])
    );
  });

  test("result can gate instantiation without throwing", () => {
    const userResult = valify.result(User.prototype, { name: "Alice", age: 30 });
    const profileResult = valify.result(Profile.prototype, {
      nickname: "x",
      email: "bad-email",
    });

    const user = userResult.ok ? new User(userResult.data) : null;
    const profile = profileResult.ok ? new Profile(profileResult.data) : null;

    expect(user).toBeInstanceOf(User);
    expect(profile).toBeNull();
    expect(profileResult.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Case 4: Schema Composition (Virtual Schema)
// ─────────────────────────────────────────────

describe("Case 4: Schema Composition", () => {
  test("validates a virtual schema without instantiating", () => {
    const errors = valify.validateSchema(
      { u: User.prototype, p: Profile.prototype },
      {
        u: { name: "ab", age: -1 },
        p: { nickname: "x", email: "bad" },
      }
    );
    const paths = errors.map((e) => e.path);
    expect(paths).toContain("u.name");
    expect(paths).toContain("u.age");
    expect(paths).toContain("p.nickname");
    expect(paths).toContain("p.email");
  });

  test("valid schema data yields no errors", () => {
    const errors = valify.validateSchema(
      { u: User.prototype, p: Profile.prototype },
      {
        u: { name: "Alice", age: 30 },
        p: { nickname: "ali", email: "ali@example.com" },
      }
    );
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// Case 5: Strict Mode — unknown nested objects
// ─────────────────────────────────────────────

describe("Case 5: Strict Mode", () => {
  test("throws ValifyConfigurationError for unknown nested objects", () => {
    @Valified()
    class Outer {
      @UsePolicy(rules.required())
      inner!: object;

      constructor(data: Partial<Outer>) {
        Object.assign(this, data);
      }
    }

    // Provide a plain object (no @Valified) to trigger strict mode
    expect(() => valify.validate(Outer.prototype, { inner: { foo: "bar" } })).toThrow(
      ValifyConfigurationError
    );
  });
});

// ─────────────────────────────────────────────
// Case 6: @Satisfies cross-field spec
// ─────────────────────────────────────────────

describe("Case 6: @Satisfies cross-field specification", () => {
  @Satisfies((d) => {
    const data = d as { start: number; end: number };
    return data.end > data.start ? null : "end must be after start";
  })
  @Valified()
  class DateRange {
    @UsePolicy(rules.required(), rules.number())
    start!: number;

    @UsePolicy(rules.required(), rules.number())
    end!: number;

    constructor(data: Partial<DateRange>) {
      Object.assign(this, data);
    }
  }

  test("throws when spec is violated", () => {
    expect(() => new DateRange({ start: 10, end: 5 })).toThrow(ValifyError);
  });

  test("does not throw when spec is satisfied", () => {
    expect(() => new DateRange({ start: 1, end: 10 })).not.toThrow();
  });

  test("error path contains '.*' suffix", () => {
    try {
      new DateRange({ start: 10, end: 5 });
      throw new Error("Should have thrown");
    } catch (err) {
      const e = err as ValifyError;
      expect(e.errors.some((x) => x.path.endsWith("*"))).toBe(true);
    }
  });

  test("multiple @Satisfies specs are all evaluated", () => {
    @Satisfies(
      (d) => ((d as { a: number }).a > 0 ? null : "a must be positive"),
      (d) => ((d as { b: number }).b > 0 ? null : "b must be positive")
    )
    @Valified()
    class TwoSpecs {
      @UsePolicy(rules.number())
      a!: number;

      @UsePolicy(rules.number())
      b!: number;

      constructor(data: Partial<TwoSpecs>) {
        Object.assign(this, data);
      }
    }

    try {
      new TwoSpecs({ a: -1, b: -1 });
      throw new Error("Should have thrown");
    } catch (err) {
      const e = err as ValifyError;
      expect(e.errors.length).toBeGreaterThanOrEqual(2);
    }
  });
});

// ─────────────────────────────────────────────
// Case 7: Custom Rule functions
// ─────────────────────────────────────────────

describe("Case 7: Custom Rule functions", () => {
  const isEven = (value: unknown): string | null => {
    if (typeof value !== "number" || value % 2 !== 0) return "Must be an even number";
    return null;
  };

  @Valified()
  class EvenOnly {
    @UsePolicy(isEven)
    count!: number;

    constructor(data: Partial<EvenOnly>) {
      Object.assign(this, data);
    }
  }

  test("custom rule passes for valid value", () => {
    expect(() => new EvenOnly({ count: 4 })).not.toThrow();
  });

  test("custom rule fails for invalid value", () => {
    expect(() => new EvenOnly({ count: 3 })).toThrow(ValifyError);
  });

  test("custom rule error message is preserved", () => {
    try {
      new EvenOnly({ count: 3 });
      throw new Error("Should have thrown");
    } catch (err) {
      const e = err as ValifyError;
      expect(e.errors[0].message).toBe("Must be an even number");
    }
  });
});

// ─────────────────────────────────────────────
// Case 8: valify.validateOrThrow directly
// ─────────────────────────────────────────────

describe("Case 8: valify.validateOrThrow", () => {
  test("throws ValifyError for invalid object", () => {
    const instance = Object.assign(Object.create(User.prototype) as User, {
      name: "ab",
      age: -1,
    });
    expect(() => valify.validateOrThrow(instance)).toThrow(ValifyError);
  });

  test("does not throw for valid object", () => {
    const instance = Object.assign(Object.create(User.prototype) as User, {
      name: "Alice",
      age: 30,
    });
    expect(() => valify.validateOrThrow(instance)).not.toThrow();
  });
});

// ─────────────────────────────────────────────
// Case 9: result return value
// ─────────────────────────────────────────────

describe("Case 9: result return value", () => {
  test("result can be used to instantiate only valid payloads", () => {
    const result = valify.result(User.prototype, { name: "Alice", age: 30 });
    const user = result.ok ? new User(result.data) : null;

    expect(user).toBeInstanceOf(User);
    expect((user as User).name).toBe("Alice");
  });

  test("result exposes validation errors for invalid payloads", () => {
    const result = valify.result(User.prototype, { name: "ab", age: -1 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(2);
    }
  });
});

// ─────────────────────────────────────────────
// Case 10: Factory API with options
// ─────────────────────────────────────────────

describe("Case 10: createValidator options", () => {
  test("result returns ok=false with aggregated errors", () => {
    const validator = createValidator();
    const res = validator.result(User.prototype, { name: "ab", age: -1 });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.length).toBe(2);
    }
  });

  test("result returns ok=true for valid payload", () => {
    const validator = createValidator();
    const res = validator.result(User.prototype, { name: "Alice", age: 30 });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.name).toBe("Alice");
    }
  });

  test("stopAtFirstError returns only one error", () => {
    const validator = createValidator({ stopAtFirstError: true });
    const errors = validator.validate(User.prototype, { name: "ab", age: -1 });
    expect(errors.length).toBe(1);
  });

  test("unknownObjectMode=ignore does not throw on plain nested objects", () => {
    @Valified()
    class Outer {
      @UsePolicy(rules.required())
      inner!: object;

      constructor(data: Partial<Outer>) {
        Object.assign(this, data);
      }
    }

    const validator = createValidator({ unknownObjectMode: "ignore" });
    expect(() => validator.validate(Outer.prototype, { inner: { foo: "bar" } })).not.toThrow();
  });

  test("default valify instance can be used directly", () => {
    const errors = valify.validate(User.prototype, { name: "ab", age: -1 });
    expect(errors.length).toBe(2);
  });
});
