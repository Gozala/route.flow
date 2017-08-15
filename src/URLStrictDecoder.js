/* @flow */

import type { URL, Parser, Parse } from "./URLParser"
import { parsePath, parseHash } from "./URLParser"

interface Decode {
  <x>(Parser<[]>, URL, () => x): ?x,
  <x, a>(Parser<[a]>, URL, (a) => x): ?x,
  <x, a, b>(Parser<[a, b]>, URL, (a) => b => x): ?x,
  <x, a, b, c>(Parser<[a, b, c]>, URL, (a) => b => c => x): ?x,
  <x, a, b, c, d>(Parser<[a, b, c, d]>, URL, (a) => b => c => d => x): ?x,
  <x, a, b, c, d, e>(
    Parser<[a, b, c, d, e]>,
    URL,
    (a) => b => c => d => e => x
  ): ?x,
  <x, a, b, c, d, e, f>(
    Parser<[a, b, c, d, e]>,
    URL,
    (a) => b => c => d => e => f => x
  ): ?x,
  <x, a, b, c, d, e, f, g>(
    Parser<[a, b, c, d, e]>,
    URL,
    (a) => b => c => d => e => f => g => x
  ): ?x,
  <x, a, b, c, d, e, f, g, h>(
    Parser<[a, b, c, d, e]>,
    URL,
    (a) => b => c => d => e => f => g => h => x
  ): ?x
}

export const decoder = (parse: Parse): Decode => (parser, url, decoder) => {
  const params = parse(parser, url)
  if (params == null) {
    return null
  } else {
    for (let param of params) {
      decoder = decoder(param)
    }
    return decoder
  }
}

export const decodePath = decoder(parsePath)
export const decodeHash = decoder(parseHash)
