/* @flow */

import type { Push } from "./Route/Tuple"
import type { float } from "float.flow"
import type { integer } from "integer.flow"
import type { URL, Query } from "./Route/URL"
import { push, last, butlast } from "./Route/Tuple"
import { identity } from "./Route/Prelude"
import { parseInteger } from "integer.flow"
import { parseFloat } from "float.flow"
import { toString, parseString } from "./Route/String"
import { parsePathname, parseSearch, formatURL } from "./Route/URL"

export type { float, integer, URL, Query, Push }

export type Parse = <a>(Route<a>, URL) => ?a

export type State<a> = {
  segments: Array<string>,
  params: a,
  query: Query
}

export interface ConstantSegment {
  parseSegment<inn>(State<inn>): ?State<inn>,
  formatSegment<inn>(State<inn>): State<inn>
}

export interface VariableSegment<a> {
  parseSegment<inn>(State<inn>): ?State<Push<inn, a>>,
  formatSegment<inn>(State<Push<inn, a>>): State<inn>
}

interface QueryParam<a> {
  parseQueryParam<inn>(string, State<inn>): ?State<Push<inn, a>>,
  formatQueryParam<inn>(string, State<Push<inn, a>>): State<inn>
}

type Segment = ConstantSegment & Route<[]>
type Param<a> = VariableSegment<a> & QueryParam<a> & Route<[a]>

export interface Route<a> {
  parseRoute(State<[]>): ?State<a>,
  formatRoute(State<a>): State<[]>,
  //   concat<other>(Route<other>): Route<Concat<out, other>>,
  parsePath(URL): ?a,
  parseHash(URL): ?a,
  parse(string[], Query): ?a,

  format(...Array<mixed> & a): URL,
  formatPath(...Array<mixed> & a): string,
  formatHash(...Array<mixed> & a): string,

  segment(segment?: string): Route<a>,
  rest<b>(VariableSegment<b>): Route<Push<a, b>>,
  param<b>(VariableSegment<b>): Route<Push<a, b>>,
  query<b>(string, QueryParam<b>): Route<Push<a, b>>
}

class Model<a> {
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

class URLRoute<a> implements Route<a> {
  +parseRoute: (state: State<[]>) => ?State<a>
  +formatRoute: (state: State<a>) => State<[]>

  segment(text: string = ""): Route<a> {
    return new ChainConstant(this, new RouteSegment(text))
  }
  param<b>(param: VariableSegment<b>): Route<Push<a, b>> {
    return new ChainVariable(this, param)
  }
  query<b>(name: string, param: QueryParam<b>): Route<Push<a, b>> {
    return new ChainVariable(this, new QuerySegment(name, param))
  }
  rest<b>(param: VariableSegment<b>): Route<Push<a, b>> {
    return new ChainVariable(this, new RestSegment(param))
  }
  //   concat<other>(route: Route<other>): Route<Concat<out, other>> {
  //     return concat(this, route)
  //   }
  parsePath(url: URL): ?a {
    return parsePath(this, url)
  }
  parseHash(url: URL): ?a {
    return parseHash(this, url)
  }
  parse(segments: string[], query: Query): ?a {
    return parse(this, segments, query)
  }
  formatPath(...params: a & Array<mixed>): string {
    return formatPath(this, ...params)
  }
  formatHash(...params: a & Array<mixed>): string {
    return formatHash(this, ...params)
  }
  format(...params: a & Array<mixed>): URL {
    return format(this, ...params)
  }
}

class VariableRoute<a> extends URLRoute<[a]> implements VariableSegment<a> {
  +parseSegment: <inn>(State<inn>) => ?State<Push<inn, a>>
  +formatSegment: <inn>(State<Push<inn, a>>) => State<inn>

  parseRoute(state: State<[]>): ?State<[a]> {
    return this.parseSegment(state)
  }
  formatRoute(state: State<[a]>): State<[]> {
    return this.formatSegment(state)
  }
}

class BaseSegment extends URLRoute<[]> implements ConstantSegment {
  parseSegment<inn>(state: State<inn>): ?State<inn> {
    return state
  }
  formatSegment<inn>(state: State<inn>): State<inn> {
    return state
  }
  parseRoute(state: State<[]>): ?State<[]> {
    return this.parseSegment(state)
  }
  formatRoute(state: State<[]>): State<[]> {
    return this.formatSegment(state)
  }
}

class RootSegment extends BaseSegment {
  parseSegment<inn>(model: State<inn>): ?State<inn> {
    const { segments, params, query } = model
    const [first, ...rest] = segments
    if (first === "" && rest.length !== 0) {
      return state(rest, params, query)
    } else {
      return null
    }
  }
  formatSegment<inn>(model: State<inn>): State<inn> {
    const { segments, params, query } = model
    return state(["", ...segments], params, query)
  }
}

class RestSegment<a> extends VariableRoute<a> {
  inner: VariableSegment<a>
  constructor(inner: VariableSegment<a>) {
    super()
    this.inner = inner
  }
  parseSegment<inn>(model: State<inn>): ?State<Push<inn, a>> {
    const { segments, params, query } = model
    const next: State<inn> = state([segments.join("/")], params, query)
    return this.inner.parseSegment(next)
  }
  formatSegment<inn>(state: State<Push<inn, a>>): State<inn> {
    return this.inner.formatSegment(state)
  }
}

class RouteSegment extends BaseSegment {
  text: string
  constructor(text: string) {
    super()
    this.text = text
  }
  parseSegment<inn>(model: State<inn>): ?State<inn> {
    const { params, segments, query } = model
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
  formatSegment<inn>(model: State<inn>): State<inn> {
    const { params, segments, query } = model
    return state([this.text, ...segments], params, query)
  }
}

class RouteParam<a> extends VariableRoute<a> /*implements QueryParam<a>*/ {
  parseParam: string => ?a
  formatParam: a => string
  constructor(parseParam: string => ?a, formatParam: a => string) {
    super()
    this.parseParam = parseParam
    this.formatParam = formatParam
  }
  parseSegment<inn>(model: State<inn>): ?State<Push<inn, a>> {
    const { segments, params, query } = model
    if (segments.length === 0) {
      return null
    } else {
      const [next, ...rest] = segments
      const param = this.parseParam(next)
      if (param != null) {
        return state(rest, push(params, param), query)
      } else {
        return null
      }
    }
  }
  formatSegment<inn>(model: State<Push<inn, a>>): State<inn> {
    const { segments, params, query } = model
    const segment = this.formatParam(last(params))
    return state([segment, ...segments], butlast(params), query)
  }
  parseQueryParam<inn>(name: string, model: State<inn>): ?State<Push<inn, a>> {
    const value = model.query[name]
    const param = value != null ? this.parseParam(value) : null
    if (param == null) {
      return null
    } else {
      return state(model.segments, push(model.params, param), model.query)
    }
  }
  formatQueryParam<inn>(name: string, model: State<Push<inn, a>>): State<inn> {
    const { segments, params, query } = model
    const param = last(params)
    const value = this.formatParam(param)
    query[name] = value
    return state(segments, butlast(params), query)
  }
}

class ChainConstant<a> extends URLRoute<a> {
  base: Route<a>
  next: ConstantSegment
  constructor(base: Route<a>, next: ConstantSegment) {
    super()
    this.base = base
    this.next = next
  }
  parseRoute(state: State<[]>): ?State<a> {
    const next = this.base.parseRoute(state)
    if (next != null) {
      return this.next.parseSegment(next)
    } else {
      return null
    }
  }
  formatRoute(state: State<a>): State<[]> {
    return this.base.formatRoute(this.next.formatSegment(state))
  }
}

class ChainVariable<a, b> extends URLRoute<Push<a, b>> {
  base: Route<a>
  next: VariableSegment<b>
  constructor(base: Route<a>, next: VariableSegment<b>) {
    super()
    this.base = base
    this.next = next
  }
  parseRoute(state: State<[]>): ?State<Push<a, b>> {
    const next = this.base.parseRoute(state)
    if (next != null) {
      return this.next.parseSegment(next)
    } else {
      return null
    }
  }
  formatRoute(state: State<Push<a, b>>): State<[]> {
    return this.base.formatRoute(this.next.formatSegment(state))
  }
}

class QuerySegment<a> extends VariableRoute<a> {
  name: string
  queryParam: QueryParam<a>
  constructor(name: string, queryParam: QueryParam<a>) {
    super()
    this.name = name
    this.queryParam = queryParam
  }
  parseQueryParam<inn>(name: string, state: State<inn>): ?State<Push<inn, a>> {
    return this.queryParam.parseQueryParam(name, state)
  }
  formatQueryParam<inn>(name: string, state: State<Push<inn, a>>): State<inn> {
    return this.queryParam.formatQueryParam(name, state)
  }
  parseSegment<inn>(state: State<inn>): ?State<Push<inn, a>> {
    return this.queryParam.parseQueryParam(this.name, state)
  }
  formatSegment<inn>(state: State<Push<inn, a>>): State<inn> {
    return this.queryParam.formatQueryParam(this.name, state)
  }
}

export const rest = <a>(
  route: VariableSegment<a>
): VariableSegment<a> & Route<[a]> => new RestSegment(route)

// export const concat = <a, b>(
//   before: Route<a>,
//   after: Route<b>
// ): Route<Concat<a, b>> => new Concatenation(before, after)

export const segment = (text: string = ""): Segment => new RouteSegment(text)

export const param = <a>(parse: string => ?a, format: a => string): Param<a> =>
  new RouteParam(parse, format)

export const String: Param<string> = param(parseString, toString)
export const Integer: Param<integer> = param(parseInteger, toString)
export const Float: Param<float> = param(parseFloat, toString)

export const Base: Segment = new BaseSegment()
export const Root: Segment = new RootSegment()
export const Rest: VariableSegment<string> & Route<[string]> = new RestSegment(
  String
)

export const query = <a>(name: string, route: QueryParam<a>): Param<a> =>
  new QuerySegment(name, route)

export const parse = <a>(route: Route<a>, path: string[], query: Query): ?a => {
  const output = route.parseRoute(state(path, init, query))
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
  ...args: a & Array<mixed>
): string => format(route, ...args).toString()

export const formatHash = <a>(
  route: Route<a>,
  ...args: a & Array<mixed>
): string => `#${format(route, ...args).toString()}`

export const format = <a>(route: Route<a>, ...args: a): URL => {
  const { segments, params, query } = route.formatRoute(
    state([], args, Object.create(null))
  )
  return formatURL(segments, query)
}
