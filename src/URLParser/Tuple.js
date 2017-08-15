/* @flow */

type $ValueMap<value, mapper> = $PropertyType<
  $ObjMap<{ value: value }, mapper>,
  "value"
>

interface asOnion {
  ([]): [],
  <a>([a, []]): [a, []],
  <a, b>([b, [a, []]]): [b, [a, []]],
  <a, b, c>([c, [b, [a, []]]]): [c, [b, [a, []]]],
  <a, b, c, d>([d, [c, [b, [a, []]]]]): [d, [c, [b, [a, []]]]],
  <a, b, c, d, e>([e, [d, [c, [b, [a, []]]]]]): [e, [d, [c, [b, [a, []]]]]],
  <a, b, c, d, e, f>(
    [f, [e, [d, [c, [b, [a, []]]]]]]
  ): [f, [e, [d, [c, [b, [a, []]]]]]],
  <a, b, c, d, e, f, g>(
    [g, [f, [e, [d, [c, [b, [a, []]]]]]]]
  ): [g, [f, [e, [d, [c, [b, [a, []]]]]]]],
  <a, b, c, d, e, f, g, h>(
    [h, g, [f, [e, [d, [c, [b, [a, []]]]]]]]
  ): [h, g, [f, [e, [d, [c, [b, [a, []]]]]]]],
  <_>(_): empty
}

interface asTuple {
  ([]): [],
  <a>([a, []]): [a],
  <a, b>([b, [a, []]]): [a, b],
  <a, b, c>([c, [b, [a, []]]]): [a, b, c],
  <a, b, c, d>([d, [c, [b, [a, []]]]]): [a, b, c, d],
  <a, b, c, d, e>([e, [d, [c, [b, [a, []]]]]]): [a, b, c, d, e],
  <a, b, c, d, e, f>([f, [e, [d, [c, [b, [a, []]]]]]]): [a, b, c, d, e, f],
  <a, b, c, d, e, f, g>(
    [g, [f, [e, [d, [c, [b, [a, []]]]]]]]
  ): [a, b, c, d, e, f, g],
  <a, b, c, d, e, f, g, h>(
    [h, g, [f, [e, [d, [c, [b, [a, []]]]]]]]
  ): [a, b, c, d, e, f, g, h],
  <_>(_): empty
}

export type AsTuple<a> = $ValueMap<a, asTuple>
export type AsOnion<a> = $ValueMap<a, asOnion>

export const toTuple = <a>(input: AsOnion<a>): AsTuple<a> => {
  const tuple = []
  let rest = input
  while (rest != null && rest.length !== 0) {
    const [head, tail] = (rest: any)
    rest = tail
    tuple.unshift(head)
  }
  return (tuple: any)
}
