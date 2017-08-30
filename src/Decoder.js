/* @flow */

import type { URL, Route, Parse, Tuple } from "./Route"
import { parsePath, parseHash } from "./Route"

export const decoder = (parse: Parse) => <a: Tuple, b>(
  route: Route<a>,
  url: URL,
  decode: (...a) => b
): ?b => {
  const params = parse(route, url)
  return params == null ? null : decode(...params)
}

export const decodePath = decoder(parsePath)
export const decodeHash = decoder(parseHash)
