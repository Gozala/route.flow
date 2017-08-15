/* @flow */

export const flatmap = <a, b>(
  f: (input: a) => Array<b>,
  array: Array<a>
): Array<b> => [].concat(...array.map(f))
