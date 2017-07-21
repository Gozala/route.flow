/* @flow */

import type { AsTuple } from "./URLParser/Tuple"
import { toTuple } from "./URLParser/Tuple"

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

const state = <a>(segments: Array<string>, params: a, query: Query): State<a> =>
  new Model(segments, params, query)

class ParserAPI<a, b> implements Parser<a, b> {
  +parse: (state: State<a>) => Array<State<b>>
  segment(name: string): ParserAPI<a, b> {
    return new ChainedParser(this, new SegmentParser(name))
  }
  chain<c>(next: (Parser<a, b>) => Parser<b, c>): ParserAPI<a, c> {
    return new ChainedParser(this, next(this))
  }
  query<c>(parser: QueryParser<b, c>): ParserAPI<a, [c, b]> {
    return new ChainedParser(this, parser)
  }
  map<c>(f: b => c): ParserAPI<a, c> {
    return new MappedParser(this, f)
  }
  lift<c>(f: (...args: AsTuple<b>) => c): Parser<a, c> {
    return new MappedParser(this, out => f(...toTuple(out)))
  }
}

class RootParser extends ParserAPI<null, null> {
  parse(state: State<null>): Array<State<null>> {
    return [state]
  }
}

class SegmentParser<a> extends ParserAPI<a, a> {
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

class UnionParser<a, b> extends ParserAPI<a, b> {
  parsers: Parser<a, b>[]
  constructor(parsers: Parser<a, b>[]) {
    super()
    this.parsers = parsers
  }
  parse(state: State<a>): Array<State<b>> {
    return flatmap(parser => parser.parse(state), this.parsers)
  }
}

class VariableParser<a, b> extends ParserAPI<a, [b, a]> {
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
}

class ChainedParser<a, b, c> extends ParserAPI<a, c> {
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

class MappedParser<a, b, c> extends ParserAPI<a, c> {
  mapper: (input: b) => c
  parser: Parser<a, b>
  constructor(parser: Parser<a, b>, mapper: b => c) {
    super()
    this.mapper = mapper
    this.parser = parser
  }
  parse(model: State<a>): Array<State<c>> {
    const { mapper, parser } = this
    return parser
      .parse(model)
      .map(({ segments, params, query }: State<b>) =>
        state(segments, mapper(params), query)
      )
  }
}

export const root: ParserAPI<null, null> = new RootParser()

export const chain = <a, b, c>(
  before: Parser<a, b>,
  after: Parser<b, c>
): ParserAPI<a, c> => new ChainedParser(before, after)

export const variable = <a, b, c>(
  parser: Parser<a, b>,
  read: string => ?c
): ParserAPI<b, [c, b]> => new VariableParser(read)

export const segment = <a>(text: string): ParserAPI<a, a> =>
  new SegmentParser(text)

export const string = <a, b>(parser: Parser<a, b>): ParserAPI<b, [string, b]> =>
  variable(parser, identity)

export const integer = <a, b>(
  parser: Parser<a, b>
): ParserAPI<b, [number, b]> => variable(parser, readInteger)

export const readInteger = (input: string): ?number => {
  const value = parseFloat(input)
  if (Number.isInteger(value)) {
    return value
  } else {
    return null
  }
}

const flatmap = <a, b>(f: (input: a) => Array<b>, array: Array<a>): Array<b> =>
  [].concat(...array.map(f))

export const identity = <a>(value: a): a => value

export const parse = <a>(
  parser: Parser<null, a>,
  url: string,
  query: Query
): ?a => {
  const variants = parser.parse(state(splitURL(url), null, query))
  return parseHelp(variants)
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

export const map = <a, b, c>(
  mapper: b => c,
  parser: Parser<a, b>
): ParserAPI<a, c> => new MappedParser(parser, mapper)

export const lift = <a, b, c>(
  lifter: (...args: AsTuple<b>) => c,
  parser: Parser<a, b>
): ParserAPI<a, c> => new MappedParser(parser, data => lifter(...toTuple(data)))

export const render = <a, b>(
  parser: Parser<a, b>,
  ...args: AsTuple<b>
): string => {
  const segments = [""]
  const stack: Array<mixed> = [parser]
  let index = 0
  while (stack.length > 0) {
    const parser = stack.pop()
    if (parser instanceof SegmentParser) {
      segments.push(parser.text)
    } else if (parser instanceof VariableParser) {
      segments.push(String(args[++index]))
    } else if (parser instanceof ChainedParser) {
      const { before, after } = parser
      stack.push(before)
      stack.unshift(after)
    }
  }
  return segments.join("/")
}

class QueryParser<a, b> implements Parser<a, [b, a]> {
  name: string
  read: (?string) => b
  constructor(name: string, read: (?string) => b) {
    this.name = name
    this.read = read
  }
  parse({ segments, params, query }: State<a>): Array<State<[b, a]>> {
    const value = this.read(query[this.name])
    if (value == null) {
      return nothing
    } else {
      return [state(segments, [value, params], query)]
    }
  }
}

export const param = <a, b>(
  name: string,
  read: (?string) => b
): QueryParser<a, b> => new QueryParser(name, read)

export const stringParam = <a>(name: string): QueryParser<a, ?string> =>
  new QueryParser(name, identity)

export const integerParam = <a>(name: string): QueryParser<a, ?number> =>
  new QueryParser(name, input => (input != null ? readInteger(input) : null))

const parseQueryString = (input: string): { [key: string]: string } =>
  input.slice(1).split("&").reduce((query, segment) => {
    const [key, value] = segment.split("=")
    query[decodeURIComponent(key)] = decodeURIComponent(value)
    return query
  }, Object.create(null))

export const parseURL = <a>(
  parser: Parser<null, a>,
  location: { pathname: string, search: string }
): ?a => parse(parser, location.pathname, parseQueryString(location.search))

export const parseHash = <a>(
  parser: Parser<null, a>,
  location: { hash: string, search: string }
): ?a =>
  parse(parser, location.hash.slice(1), parseQueryString(location.search))

const url = "/user/bob/comments/42"
const userCommentParser = segment("user")
  .chain(string)
  .segment("comments")
  .chain(integer)

userCommentParser

const comment = lift(
  (name: string, id: number) => ({ name, id }),
  userCommentParser
)
parse(comment, url, {})
parse(root, url, {})

render(userCommentParser, "Jack", 15)
