/* @flow */

import type { Lift } from "./Prelude/Lift"

export type Concat<a, b> = Lift<
  [a, b],
  {
    <x>([[], [x]]): [x],
    <a>([[a], []]): [a],
    <a, x>([[a], [x]]): [a, x],
    <a, b>([[a, b], []]): [a, b],
    <a, b, x>([[a, b], [x]]): [a, b, x],
    <a, b, c>([[a, b, c], []]): [a, b, c],
    <a, b, c, x>([[a, b, c], [x]]): [a, b, c, x],
    <a, b, c, d>([[a, b, c, d], []]): [a, b, c, d],
    <a, b, c, d, x>([[a, b, c, d], [x]]): [a, b, c, d, x],
    <a, b, c, d, e, x>([[a, b, c, d, e], [x]]): [a, b, c, d, e, x],
    <a, b, c, d, e, f>([[a, b, c, d, e, f], []]): [a, b, c, d, e, f],
    <a, b, c, d, e, f, x>([[a, b, c, d, e, f], [x]]): [a, b, c, d, e, f, x],
    <a, b, c, d, e, f, g>([[a, b, c, d, e, f, g], []]): [a, b, c, d, e, f, g],
    <a, b, c, d, e, f, g, x>(
      [[a, b, c, d, e, f, g], [x]]
    ): [a, b, c, d, e, f, g, x],
    <a, b, c, d, e, f, g, h>(
      [[a, b, c, d, e, f, g, h], []]
    ): [a, b, c, d, e, f, g, h],
    <a, b, c, d, e, f, g, h, x>(
      [[a, b, c, d, e, f, g, h], [x]]
    ): [a, b, c, d, e, f, g, h, x],
    <left>([left, []]): left,
    <_>(_): empty
  }
>
