/* @flow */

import type { AsTuple } from "./URLParser/Tuple"
import type { float } from "float.flow"
import type { integer } from "integer.flow"
import { toTuple } from "./URLParser/Tuple"
import { toString } from "./URLParser/String"
import { flatmap } from "./URLParser/Array"
import { identity } from "./URLParser/Prelude"
import { parseInteger } from "integer.flow"
import { parseFloat } from "float.flow"

export type { integer, float }

export type URL = {
  pathname?: string,
  search?: string,
  hash?: string
}

export type Query = {
  [key: string]: string
}

export interface State<a> {
  segments: Array<string>,
  params: a,
  query: Query
}

export interface Parser<a, b> {
  parse(state: State<a>): Array<State<b>>
}

export interface QueryParser<a, b> {
  parseParam(string, state: State<a>): Array<State<b>>
}

export interface SegmentParser<inn = *> extends Parser<inn, inn> {
  kind: "Match"
}

export interface PathParamParser<out, inn = *> extends Parser<inn, [out, inn]> {
  kind: "Parse"
}

export interface QueryParamParser<out, inn = *>
  extends QueryParser<inn, [out, inn]> {
  kind: "Parse"
}

export type ParamParser<out> = PathParamParser<out> & QueryParamParser<out>

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

class PathParser<a, b> implements Parser<a, b> {
  +parse: (state: State<a>) => Array<State<b>>
  segment(name: string): PathParser<a, b> {
    return new Append(this, new Segment(name))
  }
  param<c>(parser: PathParamParser<c, b>): PathParser<a, [c, b]> {
    return new Append(this, parser)
  }
  query<c>(name: string, parser: QueryParser<b, c>): PathParser<a, c> {
    return new Append(this, new QueryParam(name, parser))
  }
}

class RootParser extends PathParser<[], []> {
  parse(state: State<[]>): Array<State<[]>> {
    return [state]
  }
}

class Segment<a> extends PathParser<a, a> implements SegmentParser<a> {
  kind = "Match"
  text: string
  constructor(text: string) {
    super()
    this.text = text
  }
  parse({ params, segments, query }: State<a>): Array<State<a>> {
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

class Param<a, b> extends PathParser<a, [b, a]>
  implements PathParamParser<b, a>, QueryParamParser<b, a> {
  kind = "Parse"
  read: string => ?b
  constructor(read: string => ?b) {
    super()
    this.read = read
  }
  parse({ segments, params, query }: State<a>): Array<State<[b, a]>> {
    if (segments.length === 0) {
      return nothing
    } else {
      const [next, ...rest] = segments
      const chunk = this.read(next)
      if (chunk != null) {
        return [state(rest, [chunk, params], query)]
      } else {
        return nothing
      }
    }
  }
  parseParam(
    name: string,
    { segments, params, query }: State<a>
  ): Array<State<[b, a]>> {
    const param = query[name]
    const value = param != null ? this.read(param) : null
    if (value == null) {
      return nothing
    } else {
      return [state(segments, [value, params], query)]
    }
  }
}

class Append<a, b, c> extends PathParser<a, c> {
  before: Parser<a, b>
  after: Parser<b, c>
  constructor(before: Parser<a, b>, after: Parser<b, c>) {
    super()
    this.before = before
    this.after = after
  }
  parse(state: State<a>): Array<State<c>> {
    const { before, after } = this
    return flatmap((state: State<b>) => after.parse(state), before.parse(state))
  }
}

export const Root: PathParser<[], []> = new RootParser()

export const append = <a, b, c>(
  before: Parser<a, b>,
  after: Parser<b, c>
): PathParser<a, c> => new Append(before, after)

export const segment = <a>(text: string): Segment<a> => new Segment(text)

export const paramParser = <a>(read: string => ?a): ParamParser<a> =>
  new Param(read)

export const String: ParamParser<string> = paramParser(identity)
export const Integer: ParamParser<integer> = paramParser(parseInteger)
export const Float: ParamParser<float> = paramParser(parseFloat)

export const parse = <a, b>(
  parser: Parser<[], a>,
  url: string,
  query: Query,
  handler: (...args: AsTuple<a>) => b
): ?b => {
  const variants = parser.parse(state(splitURL(url), init, query))
  const output = parseHelp(variants)
  if (output == null) {
    return null
  } else {
    return handler(...toTuple(output))
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

export const splitURL = (url: string): string[] => {
  const segments = url.split("/")
  if (segments.length > 0 && segments[0] === "") {
    return segments.slice(1)
  } else {
    return segments
  }
}

export const format = <a, b>(
  parser: Parser<a, b>,
  ...args: AsTuple<b>
): string => {
  const segments = [""]
  const queryParams = []
  const stack: Array<mixed> = [parser]
  let index = 0
  while (stack.length > 0) {
    const parser = stack.pop()
    if (parser instanceof Segment) {
      segments.push(parser.text)
    } else if (parser instanceof Param) {
      segments.push(toString(args[index++]))
    } else if (parser instanceof Append) {
      const { before, after } = parser
      stack.push(before)
      stack.unshift(after)
    } else if (parser instanceof QueryParam) {
      const value = encodeURIComponent(toString(args[index++]))
      const name = encodeURIComponent(parser.name)
      queryParams.push(`${name}=${value}`)
    }
  }

  const path = segments.join("/")
  const query = queryParams.join("&")
  const search = query === "" ? "" : `?${query}`
  return `${path}${query}`
}

class QueryParam<a, b> extends PathParser<a, b> {
  name: string
  parser: QueryParser<a, b>
  constructor(name: string, parser: QueryParser<a, b>) {
    super()
    this.name = name
    this.parser = parser
  }
  parse(state: State<a>): Array<State<b>> {
    return this.parser.parseParam(this.name, state)
  }
}

export const query = <a, b>(
  name: string,
  parser: QueryParser<a, b>
): PathParser<a, b> => new QueryParam(name, parser)

const parseQueryString = (input: string): { [key: string]: string } =>
  input.slice(1).split("&").reduce((query, segment) => {
    const [key, value] = segment.split("=")
    query[decodeURIComponent(key)] =
      value == null ? "" : decodeURIComponent(value)
    return query
  }, Object.create(null))

export const parsePath = <a, b>(
  parser: Parser<[], a>,
  url: URL,
  handler: (...args: AsTuple<a>) => b = (...args) => args
): ?b =>
  parse(
    parser,
    url.pathname || "",
    url.search == null ? {} : parseQueryString(url.search),
    handler
  )

export const parseHash = <a, b>(
  parser: Parser<[], a>,
  url: URL,
  handler: (...args: AsTuple<a>) => b = (...args) => args
): ?b =>
  parse(
    parser,
    (url.hash || "").slice(1),
    url.search == null ? {} : parseQueryString(url.search),
    handler
  )
