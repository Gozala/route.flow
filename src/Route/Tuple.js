/* @flow */

import type { Lift } from "./Prelude/Lift"

export type Concat<left, right> = Lift<
  right,
  {
    <xs, x>(Concat<xs, [x]>): Concat<Concat<left, xs>, [x]>,
    ([]): left
  }
>

export const withlast = <x, xs>(tuple: xs, last: x): Concat<xs, [x]> => [
  ...(tuple: any),
  last
]

export const last = <xs, x>(tuple: Concat<xs, [x]>): x =>
  tuple[tuple.length - 1]

export const butlast = <xs, x>(tuple: Concat<xs, [x]>): xs =>
  (tuple: any).slice(0, tuple.length - 1)
