/* @flow */

import type { AsTuple } from "./URLParser/Tuple"
import type { Parser, State } from "./URLParser.legacy"

import {
  append,
  splitURL,
  segment,
  Root,
  format,
  parse,
  parsePath,
  parseHash
} from "./URLParser.legacy"

import * as URLParser from "./URLParser.legacy"

type SegmentReader<a, b> = {
  parser: Parser<a, b>,
  parse(State<a>): Array<State<b>>,
  (fragments: string[], ...params: string[]): VariableReader<a, b>
}

type VariableReader<a, b> = {
  parser: Parser<a, b>,
  parse(State<a>): Array<State<b>>,
  <c>(Parser<b, c>): SegmentReader<a, c>
}

const interleave = <a>(xs: a[], ys: a[]): a[] => {
  let result = []
  let index = 0
  while (true) {
    if (index < xs.length) {
      const x = xs[index]
      if (index < ys.length) {
        const y = ys[index++]
        result.push(x)
        result.push(y)
      } else {
        break
      }
    } else {
      break
    }
  }
  return result
}

const variableReader = <a, b>(base: Parser<a, b>): VariableReader<a, b> => {
  const reader = <c>(parser: Parser<b, c>): SegmentReader<a, c> =>
    segmentReader(append(base, parser))
  reader.parse = state => base.parse(state)
  reader.parser = base
  return reader
}

const segmentReader = <a, b>(base: Parser<a, b>): SegmentReader<a, b> => {
  const reader = (
    fragments: string[],
    ...params: string[]
  ): VariableReader<a, b> => {
    const path = String.raw({ raw: (fragments: any) }, ...params)
    const parts = splitURL(path)
    let parser = base
    for (let fragment of parts) {
      if (fragment !== "") {
        parser = append(parser, segment(fragment))
      }
    }

    return variableReader(parser)
  }
  reader.parser = base
  reader.parse = state => base.parse(state)

  return reader
}

export const path = <a>(
  fragments: string[],
  ...params: string[]
): VariableReader<[], []> => {
  const parser = segmentReader(Root)(fragments, ...params)
  return variableReader(parser)
}

const post = path`/user/`(URLParser.String)`/comments/`(URLParser.Integer)
const profile = path`/user/`(URLParser.String)
const route = path`/blog/`(URLParser.String)`/id/`(URLParser.Integer)

parse(route, "/user/bob/comments/17", {}, (name: string, id: number) => {})
