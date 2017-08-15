/* @flow */

import type { Concat } from "./URLParser/Concat"
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

export type Parse = <a>(Parser<a>, URL) => ?a

export interface State<a> {
  segments: Array<string>,
  params: a,
  query: Query
}

export interface SegmentParser<out> {
  parseSegment<inn>(state: State<inn>): State<Concat<inn, out>>[]
}

export interface QueryParser<out> {
  parseParam<inn>(string, state: State<inn>): State<Concat<inn, out>>[]
}

export interface Parser<out> extends SegmentParser<out> {
  parsePath(URL): ?out,
  parseHash(URL): ?out,
  formatPath(...params: Array<mixed> & out): string,
  formatHash(...params: Array<mixed> & out): string
}

export type ParamParser<out> = Parser<out> & QueryParser<out>

class Model<a> implements State<a> {
  segments: Array<string>
  params: a
  query: Query
  constructor(segments: Array<string>, params: a, query: Query) {
    this.segments = segments
    this.params = params
    this.query = query
  }
}

const nothing: Array<any> = Object.freeze([])
const init: [] = Object.freeze([])

const state = <a>(segments: Array<string>, params: a, query: Query): State<a> =>
  new Model(segments, params, query)

class URLParser<out> implements Parser<out> {
  +parseSegment: <inn>(state: State<inn>) => Array<State<Concat<inn, out>>>

  segment(name: string = ""): URLParser<out> {
    return new Concatenation(this, new Segment(name))
  }
  param<b>(parser: Parser<[b]>): URLParser<Concat<out, [b]>> {
    return new Concatenation(this, parser)
  }
  query<b>(
    name: string,
    paramParser: QueryParser<[b]>
  ): URLParser<Concat<out, [b]>> {
    return this.param(query(name, paramParser))
  }
  formatPath(...params: Array<mixed> & out): string {
    return formatPath(this, ...params)
  }
  formatHash(...params: Array<mixed> & out): string {
    return formatHash(this, ...params)
  }
  parsePath(url: URL): ?out {
    return parsePath(this, url)
  }
  parseHash(url: URL): ?out {
    return parseHash(this, url)
  }
}

class RootParser extends URLParser<[]> {
  parseSegment<inn>(state: State<inn>): State<inn>[] {
    return [state]
  }
}

class Segment extends URLParser<[]> {
  text: string
  constructor(text: string) {
    super()
    this.text = text
  }
  parseSegment<inn>({ params, segments, query }: State<inn>): State<inn>[] {
    const { text } = this
    if (segments.length === 0) {
      return nothing
    } else {
      const [first, ...rest] = segments
      if (first === text) {
        return [state(rest, params, query)]
      } else {
        return nothing
      }
    }
  }
}

class Param<a> extends URLParser<[a]>
  implements ParamParser<[a]>, Parser<[a]>, QueryParser<[a]> {
  read: string => ?a
  constructor(read: string => ?a) {
    super()
    this.read = read
  }
  parseSegment<inn>({
    segments,
    params,
    query
  }: State<inn>): Array<State<Concat<inn, [a]>>> {
    if (segments.length === 0) {
      return nothing
    } else {
      const [next, ...rest] = segments
      const chunk = this.read(next)
      if (chunk != null) {
        return [state(rest, [...(params: any), chunk], query)]
      } else {
        return nothing
      }
    }
  }
  parseParam<inn>(
    name: string,
    { segments, params, query }: State<inn>
  ): Array<State<Concat<inn, [a]>>> {
    const param = query[name]
    const value = param != null ? this.read(param) : null
    if (value == null) {
      return nothing
    } else {
      return [state(segments, [...(params: any), value], query)]
    }
  }
}

class Concatenation<a, b> extends URLParser<Concat<a, b>> {
  before: Parser<a>
  after: Parser<b>
  constructor(before: Parser<a>, after: Parser<b>) {
    super()
    this.before = before
    this.after = after
  }
  parseSegment<inn>(
    state: State<inn>
  ): Array<State<Concat<Concat<inn, a>, b>>> {
    const { before, after } = this
    return flatmap(
      (state: State<Concat<inn, a>>): State<Concat<Concat<inn, a>, b>>[] =>
        after.parseSegment(state),
      (before.parseSegment(state): State<Concat<inn, a>>[])
    )
  }
}

class QueryParam<out> extends URLParser<[out]> {
  name: string
  parser: QueryParser<[out]>
  constructor(name: string, parser: QueryParser<[out]>) {
    super()
    this.name = name
    this.parser = parser
  }
  parseSegment<inn>(state: State<inn>): Array<State<Concat<inn, [out]>>> {
    return this.parser.parseParam(this.name, state)
  }
}

export const Root: URLParser<[]> = new RootParser()
export const concat = <a, b>(
  before: Parser<a>,
  after: Parser<b>
): URLParser<Concat<a, b>> => new Concatenation(before, after)

export const segment = (text: string = ""): URLParser<[]> => new Segment(text)
export const paramParser = <a>(read: string => ?a): ParamParser<[a]> =>
  new Param(read)

export const String: ParamParser<[string]> = paramParser(identity)
export const Integer: ParamParser<[integer]> = paramParser(parseInteger)
export const Float: ParamParser<[float]> = paramParser(parseFloat)

export const query = <a>(
  name: string,
  parser: QueryParser<[a]>
): URLParser<[a]> => new QueryParam(name, parser)

export const parse = <a>(parser: Parser<a>, url: string, query: Query): ?a => {
  const variants = parser.parseSegment(state(readPath(url), init, query))
  const output = parseHelp(variants)
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
    const [state, ...rest] = states
    if (state.segments.length === 0) {
      return state.params
    } else if (state.segments.length === 1 && state.segments[0] === "") {
      return state.params
    } else {
      return parseHelp(rest)
    }
  }
}

export const parsePath = <a>(parser: Parser<a>, url: URL): ?a =>
  parse(
    parser,
    url.pathname || "",
    url.search == null ? {} : readQuery(url.search)
  )

export const parseHash = <a>(parser: Parser<a>, url: URL): ?a =>
  parse(
    parser,
    (url.hash || "").slice(1),
    url.search == null ? {} : readQuery(url.search)
  )

export const formatPath = <a>(
  parser: Parser<a>,
  ...args: Array<mixed> & a
): string => format(parser, ...args)

export const formatHash = <a>(
  parser: Parser<a>,
  ...args: Array<mixed> & a
): string => `#${format(parser, ...args)}`

export const format = <a>(
  parser: Parser<a>,
  ...args: Array<mixed> & a
): string => {
  const segments = [""]
  const queryParams = []
  const stack: Array<mixed> = [parser]
  let index = 0
  while (stack.length > 0) {
    const parser = stack.pop() //?
    if (parser instanceof RootParser) {
      continue
    } else if (parser instanceof Segment) {
      segments.push(parser.text)
    } else if (parser instanceof Param) {
      segments.push(toString(args[index++]))
    } else if (parser instanceof Concatenation) {
      const { before, after } = parser
      stack.push(after)
      stack.push(before)
    } else if (parser instanceof QueryParam) {
      const value = encodeURIComponent(toString(args[index++]))
      const name = encodeURIComponent(parser.name)
      queryParams.push(`${name}=${value}`)
    }
  }

  const pathname = segments.join("/")
  const query = queryParams.join("&")
  const search = queryParams === "" ? "" : `?${query}`
  return `${pathname}${search}`
}
