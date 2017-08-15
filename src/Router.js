/* @flow */

import type { Parser, State } from "./URLParser"
import type { Concat } from "./URLParser/Concat"
import { readPath } from "./URLParser/URL"
import { concat, segment, Root } from "./URLParser"

import * as URLParser from "./URLParser"

export interface Param<out> {
  parser: Parser<out>,
  <next>(parser: Parser<next>): Segment<Concat<out, next>>
}

export interface Segment<out> {
  parser: Parser<out>,
  (string[], ...string[]): Param<out>
}

const paramReader = <a>(base: Parser<a>): Param<a> => {
  const reader = <b>(parser: Parser<b>): Segment<Concat<a, b>> =>
    segmentReader(concat(base, parser))
  reader.parser = base

  return reader
}

const segmentReader = <a>(base: Parser<a>): Segment<a> => {
  const reader = (fragments: string[], ...params: string[]): Param<a> => {
    const path = String.raw({ raw: (fragments: any) }, ...params)
    const parts = readPath(path)
    let parser = base
    for (let fragment of parts) {
      if (fragment !== "") {
        parser = concat(parser, segment(fragment))
      }
    }

    return paramReader(parser)
  }
  reader.parser = base

  return reader
}

export const path = (fragments: string[], ...params: string[]): Param<[]> =>
  segmentReader(Root)(fragments, ...params)

export const toParser = <out>(route: Segment<out> | Param<out>): Parser<out> =>
  route.parser

// export const parsePath = <out>(
//   { parser }: Link<out>,
//   url: URLParser.URL
// ): ?out => URLParser.parsePath(parser, url)

// export const parseHash = <out>(
//   { parser }: Link<out>,
//   url: URLParser.URL
// ): ?out => URLParser.parseHash(parser, url)
