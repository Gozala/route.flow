/* @flow */

export type URL = {
  pathname?: string,
  search?: string,
  hash?: string
}

export type Query = {
  [key: string]: string
}

export const readPath = (url: string): string[] => {
  const segments = url.split("/")
  if (segments.length > 0 && segments[0] === "") {
    return segments.slice(1)
  } else {
    return segments
  }
}

export const writePath = (segments: string[]): string => {
  const path = segments.join("/")
  return path[0] === "/" ? path : `/${path}`
}

export const readQuery = (input: string): Query =>
  input.slice(1).split("&").reduce((query, segment) => {
    const [key, value] = segment.split("=")
    query[decodeURIComponent(key)] =
      value == null ? "" : decodeURIComponent(value)
    return query
  }, Object.create(null))

export const writeQuery = (query: Query): string => {
  let result = ""
  for (let key of Object.keys(query)) {
    result += `&${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`
  }
  return result.slice(1)
}
