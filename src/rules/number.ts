/** Inclusive numeric range used by the helper predicates in this module. */
export interface NumericRange {
  start: number;
  end: number;
}

/** Parameters for numeric range checks. */
export interface NumericRangeCheck {
  value: number;
  range: NumericRange;
}

/** Returns whether a number is strictly positive. */
export const isPositive = (value: number): boolean => {
  return value > 0;
};

/** Returns whether a number is strictly negative. */
export const isNegative = (value: number): boolean => {
  return value < 0;
};

/** Returns whether a number is inside an inclusive range. */
export const isInsideRange = ({ value, range }: NumericRangeCheck): boolean => {
  return value >= range.start && value <= range.end;
};
