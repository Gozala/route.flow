/* @flow */

import type { Route, State } from "./Route"
import type { Concat } from "./Route/Concat"
import { parsePathname } from "./Route/URL"
import { concat, segment, Root } from "./Route"

export interface Param<out> {
  route: Route<out>,
  <next>(route: Route<next>): Segment<Concat<out, next>>
}

export interface Segment<out> {
  route: Route<out>,
  (string[], ...string[]): Param<out>
}

const paramReader = <a>(base: Route<a>): Param<a> => {
  const reader = <b>(route: Route<b>): Segment<Concat<a, b>> =>
    segmentReader(concat(base, route))
  reader.route = base

  return reader
}

const segmentReader = <a>(base: Route<a>): Segment<a> => {
  const reader = (fragments: string[], ...params: string[]): Param<a> => {
    const path = String.raw({ raw: (fragments: any) }, ...params)
    const parts = parsePathname(path)
    let route = base
    for (let fragment of parts) {
      if (fragment !== "") {
        route = concat(route, segment(fragment))
      }
    }

    return paramReader(route)
  }
  reader.route = base

  return reader
}

export const path = (fragments: string[], ...params: string[]): Param<[]> =>
  segmentReader(Root)(fragments, ...params)

export const toRoute = <out>(route: Segment<out> | Param<out>): Route<out> =>
  route.route
