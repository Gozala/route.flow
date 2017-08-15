/* @flow */

import type { URL, Parser, Parse } from "./URLParser"
import { parsePath, parseHash } from "./URLParser"

export const decoder = (parse: Parse) => <a: Iterable<*>, b>(
  parser: Parser<a>,
  url: URL,
  decode: (...a) => b
): ?b => {
  const params = parse(parser, url)
  return params == null ? null : decode(...params)
}

export const decodePath = decoder(parsePath)
export const decodeHash = decoder(parseHash)
