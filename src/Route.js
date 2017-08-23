/* @flow */

import type { Concat } from "./Route/Concat"
import type { float } from "float.flow"
import type { integer } from "integer.flow"
import type { URL, Query } from "./Route/URL"
import { separate } from "./Route/Concat"
import { identity } from "./Route/Prelude"
import { parseInteger } from "integer.flow"
import { parseFloat } from "float.flow"
import { toString, parseString } from "./Route/String"
import { parsePathname, parseSearch, formatURL } from "./Route/URL"

export type { float, integer, URL, Query, Concat }

export type Parse = <a>(Route<a>, URL) => ?a

export interface State<a> {
  segments: Array<string>,
  params: a,
  query: Query
}

export interface QueryRoute<out> {
  readParam<inn>(string, state: State<inn>): ?State<Concat<inn, out>>,
  writeParam<inn>(string, state: State<Concat<inn, out>>): State<inn>
}

export interface Route<out> {
  read<inn>(state: State<inn>): ?State<Concat<inn, out>>,
  write<inn>(state: State<Concat<inn, out>>): State<inn>,

  parsePath(URL): ?out,
  parseHash(URL): ?out,
  parse(string[], Query): ?out,

  format(...Array<mixed> & out): URL,
  formatPath(...Array<mixed> & out): string,
  formatHash(...Array<mixed> & out): string,

  segment(path?: string): Route<out>,
  param<a>(Route<[a]>): Route<Concat<out, [a]>>,
  concat<other>(Route<other>): Route<Concat<out, other>>,
  query<a>(string, QueryRoute<[a]>): Route<Concat<out, [a]>>
}

export type RouteSegment = Route<[]>
export type RouteParam<out> = Route<[out]> & QueryRoute<[out]>

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

const init: [] = Object.freeze([])
const empty: Query = Object.freeze(Object.create(null))

const state = <a>(segments: Array<string>, params: a, query: Query): State<a> =>
  new Model(segments, params, query)

class URLRoute<out> implements Route<out> {
  +read: <inn>(state: State<inn>) => ?State<Concat<inn, out>>
  +write: <inn>(state: State<Concat<inn, out>>) => State<inn>

  segment(name: string = ""): Route<out> {
    return new Concatenation(this, new Segment(name))
  }
  param<b>(route: Route<[b]>): Route<Concat<out, [b]>> {
    return new Concatenation(this, route)
  }
  concat<other>(route: Route<other>): Route<Concat<out, other>> {
    return new Concatenation(this, route)
  }
  query<b>(name: string, route: QueryRoute<[b]>): Route<Concat<out, [b]>> {
    return this.param(query(name, route))
  }

  parsePath(url: URL): ?out {
    return parsePath(this, url)
  }
  parseHash(url: URL): ?out {
    return parseHash(this, url)
  }
  parse(segments: string[], query: Query): ?out {
    return parse(this, segments, query)
  }

  formatPath(...params: Array<mixed> & out): string {
    return formatPath(this, ...params)
  }
  formatHash(...params: Array<mixed> & out): string {
    return formatHash(this, ...params)
  }
  format(...params: Array<mixed> & out): URL {
    return format(this, ...params)
  }
}

class EmptyRoute extends URLRoute<[]> {
  read<inn>(state: State<inn>): ?State<inn> {
    return state
  }
  write<inn>(state: State<inn>): State<inn> {
    return state
  }
}

class RouteRoot extends URLRoute<[]> {
  read<inn>({ segments, params, query }: State<inn>): ?State<inn> {
    const [first, ...rest] = segments
    if (first === "" && rest.length !== 0) {
      return state(rest, params, query)
    } else {
      return null
    }
  }
  write<inn>({ segments, params, query }: State<inn>): State<inn> {
    return state(["", ...segments], params, query)
  }
}

class Segment extends URLRoute<[]> {
  text: string
  constructor(text: string) {
    super()
    this.text = text
  }
  read<inn>({ params, segments, query }: State<inn>): ?State<inn> {
    const { text } = this
    if (segments.length === 0) {
      return null
    } else {
      const [first, ...rest] = segments
      if (first === text) {
        return state(rest, params, query)
      } else {
        return null
      }
    }
  }
  write<inn>({ params, segments, query }: State<inn>): State<inn> {
    return state([this.text, ...segments], params, query)
  }
}

class Param<a> extends URLRoute<[a]> implements QueryRoute<[a]> {
  parseParam: string => ?a
  formatParam: a => string
  constructor(parseParam: string => ?a, formatParam: a => string) {
    super()
    this.parseParam = parseParam
    this.formatParam = formatParam
  }
  read<inn>({ segments, params, query }: State<inn>): ?State<Concat<inn, [a]>> {
    if (segments.length === 0) {
      return null
    } else {
      const [next, ...rest] = segments
      const param = this.parseParam(next)
      if (param != null) {
        return state(rest, [...(params: any), param], query)
      } else {
        return null
      }
    }
  }
  write<inn>({ segments, params, query }: State<Concat<inn, [a]>>): State<inn> {
    const [rest, last] = separate(params)
    const segment = this.formatParam(last)
    return state([segment, ...segments], rest, query)
  }
  readParam<inn>(
    name: string,
    { segments, params, query }: State<inn>
  ): ?State<Concat<inn, [a]>> {
    const value = query[name]
    const param = value != null ? this.parseParam(value) : null
    if (param == null) {
      return null
    } else {
      return state(segments, [...(params: any), param], query)
    }
  }
  writeParam<inn>(name: string, model: State<Concat<inn, [a]>>): State<inn> {
    const { segments, params, query } = model
    const [rest, param] = separate(params)
    const value = this.formatParam(param)
    query[name] = value
    return state(segments, rest, query)
  }
}

class Concatenation<a, b> extends URLRoute<Concat<a, b>> {
  before: Route<a>
  after: Route<b>
  constructor(before: Route<a>, after: Route<b>) {
    super()
    this.before = before
    this.after = after
  }
  read<inn>(state: State<inn>): ?State<Concat<Concat<inn, a>, b>> {
    const { before, after } = this
    const next = before.read(state)
    if (next != null) {
      return after.read(next)
    } else {
      return null
    }
  }
  write<inn>(state: State<Concat<Concat<inn, a>, b>>): State<inn> {
    const next = this.after.write(state)
    return this.before.write(next)
  }
}

class QueryParam<out> extends URLRoute<[out]> {
  name: string
  route: QueryRoute<[out]>
  constructor(name: string, route: QueryRoute<[out]>) {
    super()
    this.name = name
    this.route = route
  }
  read<inn>(state: State<inn>): ?State<Concat<inn, [out]>> {
    return this.route.readParam(this.name, state)
  }
  write<inn>(state: State<Concat<inn, [out]>>): State<inn> {
    return this.route.writeParam(this.name, state)
  }
}

export const Empty: Route<[]> = new EmptyRoute()
export const Root: Route<[]> = new RouteRoot()
export const concat = <a, b>(
  before: Route<a>,
  after: Route<b>
): Route<Concat<a, b>> => new Concatenation(before, after)

export const segment = (text: string = ""): RouteSegment => new Segment(text)
export const param = <a>(
  parse: string => ?a,
  format: a => string
): RouteParam<a> => new Param(parse, format)

export const String: RouteParam<string> = param(parseString, toString)
export const Integer: RouteParam<integer> = param(parseInteger, toString)
export const Float: RouteParam<float> = param(parseFloat, toString)

export const query = <a>(name: string, route: QueryRoute<[a]>): Route<[a]> =>
  new QueryParam(name, route)

export const parse = <a>(route: Route<a>, path: string[], query: Query): ?a => {
  const output = route.read(state(path, init, query))
  if (output != null) {
    const { segments, params } = output
    if (segments.length < 1 || segments[0] == "") {
      return params
    }
  }
  return null
}

export const parsePath = <a>(route: Route<a>, url: URL): ?a =>
  parse(
    route,
    parsePathname(url.pathname || ""),
    url.search == null ? empty : parseSearch(url.search)
  )

export const parseHash = <a>(route: Route<a>, url: URL): ?a =>
  parse(
    route,
    parsePathname((url.hash || "").slice(1)),
    url.search == null ? empty : parseSearch(url.search)
  )

export const formatPath = <a>(
  route: Route<a>,
  ...args: Array<mixed> & a
): string => format(route, ...args).toString()

export const formatHash = <a>(
  route: Route<a>,
  ...args: Array<mixed> & a
): string => `#${format(route, ...args).toString()}`

export const format = <a>(route: Route<a>, ...args: a): URL => {
  const { segments, params, query } = route.write(
    state([], (args: any), Object.create(null))
  )
  return formatURL(segments, query)
}
