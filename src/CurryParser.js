/* @noflow */

import type { float } from "float.flow"
import type { integer } from "integer.flow"
import type { URL, Query } from "./URLParser/URL"
import { flatmap } from "./URLParser/Array"
import { identity } from "./URLParser/Prelude"
import { parseInteger } from "integer.flow"
import { parseFloat } from "float.flow"
import { toString } from "./URLParser/String"
import { readPath, readQuery } from "./URLParser/URL"

export type { float, integer, URL, Query }

export interface State<a> {
  path: Array<string>,
  value: a,
  query: Query
}

class Model<a> implements State<a> {
  path: Array<string>
  value: a
  query: Query
  constructor(path: Array<string>, value: a, query: Query) {
    this.path = path
    this.value = value
    this.query = query
  }
}

const nothing: Array<any> = Object.freeze([])
const init: [] = Object.freeze([])
const state = <a>(value: a, path: Array<string>, query: Query): State<a> =>
  new Model(path, value, query)

// export interface URLParser<out> {
//   parsePath(URL): ?out,
//   parseHash(URL): ?out,
//   format(...params: Array<mixed> & out): string
// }

class Parser<a, b> {
  +step: (state: State<a>) => State<b>[]
}

class ParameterParser<a, b = *> extends Parser<(a) => b, b> {
  read: string => ?a
  constructor(read: string => ?a) {
    super()
    this.read = read
  }
  step({ value, path, query }: State<(a) => b>): State<b>[] {
    if (path.length === 0) {
      return nothing
    } else {
      const [first, ...rest] = path
      const next = this.read(first)
      if (next != null) {
        return [state(value(next), rest, query)]
      } else {
        return nothing
      }
    }
  }
}

class SegmentParser<a> extends Parser<a, a> {
  segment: string
  constructor(segment: string) {
    super()
    this.segment = segment
  }
  step({ value, path, query }: State<a>): State<a>[] {
    if (path.length === 0) {
      return nothing
    } else {
      const [first, ...rest] = path
      if (first === this.segment) {
        return [state(value, rest, query)]
      } else {
        return nothing
      }
    }
  }
}

class RootParser<a> extends Parser<a, a> {
  step(state: State<a>): State<a>[] {
    return [state]
  }
}

class PipelineParser<a, b, c> extends Parser<a, c> {
  before: Parser<a, b>
  after: Parser<b, c>
  constructor(before: Parser<a, b>, after: Parser<b, c>) {
    super()
    this.before = before
    this.after = after
  }
  step(state: State<a>): State<c>[] {
    const { before, after } = this
    return flatmap(state => after.step(state), before.step(state))
  }
}

export const Root: RootParser<mixed> = new RootParser()
export const String = <a>(): ParameterParser<string, a> =>
  new ParameterParser(identity)

export const Integer = <a>(): ParameterParser<integer, a> =>
  new ParameterParser(parseInteger)
export const Float = <a>(): ParameterParser<float, a> =>
  new ParameterParser(parseFloat)

export const segment = <a>(value: string): Parser<a, a> =>
  new SegmentParser(value)
export const append = <a, b, c>(
  before: Parser<a, b>,
  after: Parser<b, c>
): Parser<a, c> => new PipelineParser(before, after)

type Parse<a> = Parser<(a) => a, a>

const parse = <a>(parser: Parse<a>, pathname: string, query: Query): ?a => {
  const variants = parser.step(state(identity, readPath(pathname), query)) //?
  const output = parseHelp(variants) //?
  if (output == null) {
    return null
  } else {
    return output
  }
}

const parseHelp = <a>(states: Array<State<a>>): ?a => {
  if (states.length === 0) {
    return null
  } else {
    const [state, ...rest] = states //?
    if (state.path.length === 0) {
      return state.value
    } else if (state.path.length === 1 && state.path[0] === "") {
      return state.value
    } else {
      return parseHelp(rest)
    }
  }
}

export const parsePath = <a>(parser: Parse<a>, url: URL): ?a =>
  parse(
    parser,
    url.pathname || "",
    url.search == null ? {} : readQuery(url.search)
  )

export const parseHash = <a>(parser: Parse<a>, url: URL): ?a =>
  parse(
    parser,
    (url.hash || "").slice(1),
    url.search == null ? {} : readQuery(url.search)
  )

const find = append(segment("find"), String())
parsePath(find, { pathname: "/find/cat/" }) //?
parsePath(find, { pathname: "/find" }) //?

const limit = append(segment("limit"), Integer())
parsePath(limit, { pathname: "/limit/cat/" }) //?
parsePath(limit, { pathname: "/limit/5/" }) //?

const findlimit = append(find, limit)
// parsePath(findlimit, { pathname: "/find/cat/limit/5/" }) //?
