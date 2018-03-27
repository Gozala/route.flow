/* @flow */

import type { URL, Route, Parse } from "./Route"
import { parsePath, parseHash } from "./Route"

interface Decode {
  <x>(Route<[]>, URL, () => x): ?x;
  <x, a>(Route<[a]>, URL, (a) => x): ?x;
  <x, a, b>(Route<[a, b]>, URL, (a) => b => x): ?x;
  <x, a, b, c>(Route<[a, b, c]>, URL, (a) => b => c => x): ?x;
  <x, a, b, c, d>(Route<[a, b, c, d]>, URL, (a) => b => c => d => x): ?x;
  <x, a, b, c, d, e>(
    Route<[a, b, c, d, e]>,
    URL,
    (a) => b => c => d => e => x
  ): ?x;
  <x, a, b, c, d, e, f>(
    Route<[a, b, c, d, e, f]>,
    URL,
    (a) => b => c => d => e => f => x
  ): ?x;
  <x, a, b, c, d, e, f, g>(
    Route<[a, b, c, d, e, f, g]>,
    URL,
    (a) => b => c => d => e => f => g => x
  ): ?x;
  <x, a, b, c, d, e, f, g, h>(
    Route<[a, b, c, d, e, f, g, h]>,
    URL,
    (a) => b => c => d => e => f => g => h => x
  ): ?x;
}

export const decoder = (parse: Parse): Decode =>
  ((route, url, decoder) => {
    const params = parse(route, url)
    if (params == null) {
      return null
    } else if (params.length === 0) {
      return decoder()
    } else {
      let next = decoder
      for (let param of params) {
        next = next(param)
      }
      return next
    }
  }: any)

export const decodePath = decoder(parsePath)
export const decodeHash = decoder(parseHash)
