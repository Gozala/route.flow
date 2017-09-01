/* @flow */

// import type { Lift } from "./Prelude/Lift"

export type Lift<value, mapper> = $PropertyType<
  $ObjMap<{ value: value }, mapper>,
  "value"
>

export type Concat<left, right> = Lift<
  [left, right],
  {
    ([[], []]): [],
    <a>([[], [a]]): [a],
    <a>([[a], []]): [a],
    <a, b>([[a], [b]]): [a, b],
    <a, b>([[], Concat<a, b>]): Concat<a, b>,
    <a, b>([Concat<a, b>, []]): Concat<a, b>,
    <a, b, c, d>(
      [Concat<a, b>, Concat<c, d>]
    ): Concat<Concat<Concat<a, b>, c>, d>
  }
>

export const withlast = <x, xs>(tuple: xs, last: x): Concat<xs, [x]> => [
  ...(tuple: any),
  last
]

export const last = <xs, x>(tuple: Concat<xs, [x]>): x =>
  (tuple: any)[(tuple: any).length - 1]

export const butlast = <xs, x>(tuple: Concat<xs, [x]>): xs =>
  (tuple: any).slice(0, (tuple: any).length - 1)

const x1: Concat<[], Concat<[number], [string]>> = [1, "hi"]

const x2: Concat<Concat<[], [string]>, [number]> = ["hi", 2]
