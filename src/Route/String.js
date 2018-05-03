// @flow strict

export const toString = (input: mixed): string => String(input)
export const parseString = (input: string): ?string =>
  input === "" ? null : input
