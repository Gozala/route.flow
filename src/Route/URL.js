/* @flow */

export type URL = {
  pathname?: string,
  search?: string,
  hash?: string,
  toString(): string
}

export type Query = {
  [key: string]: string
}

export const parsePathname = (url: string): string[] => url.split("/")

export const formatPathname = (segments: string[]): string => {
  if (segments.length === 0) {
    return ""
  } else {
    return segments.join("/")
  }
}

export const parseSearch = (input: string): Query => parseQuery(input.slice(1))

export const parseQuery = (input: string): Query =>
  input.split("&").reduce((query, segment) => {
    const [key, value] = segment.split("=")
    query[decodeURIComponent(key)] =
      value == null ? "" : decodeURIComponent(value)
    return query
  }, Object.create(null))

export const formatQuery = (query: Query): string => {
  let result = ""
  for (let key of Object.keys(query)) {
    result += `&${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`
  }
  return result.slice(1)
}

export const formatSearch = (params: Query): string => {
  const query = formatQuery(params)
  return query === "" ? "" : `?${query}`
}

class URLObject {
  pathname: string
  search: string
  hash: string
  constructor(pathname: string, search: string, hash: string) {
    this.pathname = pathname
    this.search = search
    this.hash = hash
  }
  toString() {
    return `${this.pathname}${this.hash}${this.search}`
  }
}

export const formatURL = (
  path: string[],
  query?: Query,
  hash: string = ""
): URL =>
  (new URLObject(
    formatPathname(path),
    query == null ? "" : formatSearch(query),
    hash === "" ? "" : hash[0] === "#" ? hash : `#${hash}`
  ): any) // Note: Cast to any to workaround https://github.com/facebook/flow/issues/2859
