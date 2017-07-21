/* @flow */

type $ValueMap<value, mapper> = $PropertyType<
  $ObjMap<{ value: value }, mapper>,
  "value"
>

interface asOnion {
  (null): null,
  <a>([a, null]): [a, null],
  <a, b>([b, [a, null]]): [b, [a, null]],
  <a, b, c>([c, [b, [a, null]]]): [c, [b, [a, null]]],
  <a, b, c, d>([d, [c, [b, [a, null]]]]): [d, [c, [b, [a, null]]]],
  <a, b, c, d, e>([e, [d, [c, [b, [a, null]]]]]): [e, [d, [c, [b, [a, null]]]]],
  <a, b, c, d, e, f>(
    [f, [e, [d, [c, [b, [a, null]]]]]]
  ): [f, [e, [d, [c, [b, [a, null]]]]]],
  <a, b, c, d, e, f, g>(
    [g, [f, [e, [d, [c, [b, [a, null]]]]]]]
  ): [g, [f, [e, [d, [c, [b, [a, null]]]]]]],
  <a, b, c, d, e, f, g, h>(
    [h, g, [f, [e, [d, [c, [b, [a, null]]]]]]]
  ): [h, g, [f, [e, [d, [c, [b, [a, null]]]]]]],
  <_>(_): empty
}

interface asTuple {
  (null): [],
  <a>([a, null]): [a],
  <a, b>([b, [a, null]]): [a, b],
  <a, b, c>([c, [b, [a, null]]]): [a, b, c],
  <a, b, c, d>([d, [c, [b, [a, null]]]]): [a, b, c, d],
  <a, b, c, d, e>([e, [d, [c, [b, [a, null]]]]]): [a, b, c, d, e],
  <a, b, c, d, e, f>([f, [e, [d, [c, [b, [a, null]]]]]]): [a, b, c, d, e, f],
  <a, b, c, d, e, f, g>(
    [g, [f, [e, [d, [c, [b, [a, null]]]]]]]
  ): [a, b, c, d, e, f, g],
  <a, b, c, d, e, f, g, h>(
    [h, g, [f, [e, [d, [c, [b, [a, null]]]]]]]
  ): [a, b, c, d, e, f, g, h],
  <_>(_): empty
}

export type AsTuple<a> = $ValueMap<a, asTuple>
export type AsOnion<a> = $ValueMap<a, asOnion>

export const toTuple = <a>(input: AsOnion<a>): AsTuple<a> => {
  const tuple = []
  let rest = input
  while (rest != null) {
    const [head, tail] = rest
    rest = tail
    tuple.unshift(head)
  }
  return (tuple: any)
}
