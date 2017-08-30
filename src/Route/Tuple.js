/* @flow */

import type { Lift } from "./Prelude/Lift"

export type Tuple =
  | [any, any, any, any, any, any, any, any]
  | [any, any, any, any, any, any, any]
  | [any, any, any, any, any, any]
  | [any, any, any, any, any]
  | [any, any, any, any]
  | [any, any, any]
  | [any, any]
  | [any]
  | []

export type Concat<left: Tuple, right: Tuple> = Lift<
  [left, right],
  {
    <xs, x>([left, Concat<xs, [x]>]): Concat<Concat<left, xs>, [x]>,
    ([left, []]): left
  }
>

export const withlast = <x, xs: Tuple>(tuple: xs, last: x): Concat<xs, [x]> => [
  ...(tuple: any),
  last
]

export const last = <xs: Tuple, x>(tuple: Concat<xs, [x]>): x =>
  tuple[tuple.length - 1]

export const butlast = <xs: Tuple, x>(tuple: Concat<xs, [x]>): xs =>
  (tuple: any).slice(0, tuple.length - 1)
