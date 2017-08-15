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

export const readQuery = (input: string): { [key: string]: string } =>
  input.slice(1).split("&").reduce((query, segment) => {
    const [key, value] = segment.split("=")
    query[decodeURIComponent(key)] =
      value == null ? "" : decodeURIComponent(value)
    return query
  }, Object.create(null))
