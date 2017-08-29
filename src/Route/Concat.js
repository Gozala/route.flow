/* @flow */

import type { Lift } from "./Prelude/Lift"

export type Concat<a, b> = Lift<
  [a, b],
  {
    ([[], []]): [],
    <left> ([left, []]): left,
    <right> ([[], right]):right,

    <a, $a>([[a], [$a]]): [a, $a],
    <a, $a, $b>([[a], [$a, $b]]): [a, $a, $b],
    <a, $a, $b, $c>([[a], [$a, $b, $c]]): [a, $a, $b, $c],
    <a, $a, $b, $c, $d>([[a], [$a, $b, $c, $d]]): [a, $a, $b, $c, $d],
    <a, $a, $b, $c, $d, $e>(
      [[a], [$a, $b, $c, $d, $e]]
    ): [a, $a, $b, $c, $d, $e],
    <a, $a, $b, $c, $d, $e, $f>(
      [[a], [$a, $b, $c, $d, $e, $f]]
    ): [a, $a, $b, $c, $d, $e, $f],
    <a, $a, $b, $c, $d, $e, $f, $g>(
      [[a], [$a, $b, $c, $d, $e, $f, $g]]
    ): [a, $a, $b, $c, $d, $e, $f, $g],
    <a, $a, $b, $c, $d, $e, $f, $g, $h>(
      [[a], [$a, $b, $c, $d, $e, $f, $g, $h]]
    ): [a, $a, $b, $c, $d, $e, $f, $g, $h],

    <a, b, $a>([[a, b], [$a]]): [a, b, $a],
    <a, b, $a, $b>([[a, b], [$a, $b]]): [a, b, $a, $b],
    <a, b, $a, $b, $c>([[a, b], [$a, $b, $c]]): [a, b, $a, $b, $c],
    <a, b, $a, $b, $c, $d>([[a, b], [$a, $b, $c, $d]]): [a, b, $a, $b, $c, $d],
    <a, b, $a, $b, $c, $d, $e>(
      [[a, b], [$a, $b, $c, $d, $e]]
    ): [a, b, $a, $b, $c, $d, $e],
    <a, b, $a, $b, $c, $d, $e, $f>(
      [[a, b], [$a, $b, $c, $d, $e, $f]]
    ): [a, b, $a, $b, $c, $d, $e, $f],
    <a, b, $a, $b, $c, $d, $e, $f, $g>(
      [[a, b], [$a, $b, $c, $d, $e, $f, $g]]
    ): [a, b, $a, $b, $c, $d, $e, $f, $g],
    <a, b, $a, $b, $c, $d, $e, $f, $g, $h>(
      [[a, b], [$a, $b, $c, $d, $e, $f, $g, $h]]
    ): [a, b, $a, $b, $c, $d, $e, $f, $g, $h],

    <a, b, c, $a>([[a, b, c], [$a]]): [a, b, c, $a],
    <a, b, c, $a, $b>([[a, b, c], [$a, $b]]): [a, b, c, $a, $b],
    <a, b, c, $a, $b, $c>([[a, b, c], [$a, $b, $c]]): [a, b, c, $a, $b, $c],
    <a, b, c, $a, $b, $c, $d>(
      [[a, b, c], [$a, $b, $c, $d]]
    ): [a, b, c, $a, $b, $c, $d],
    <a, b, c, $a, $b, $c, $d, $e>(
      [[a, b, c], [$a, $b, $c, $d, $e]]
    ): [a, b, c, $a, $b, $c, $d, $e],
    <a, b, c, $a, $b, $c, $d, $e, $f>(
      [[a, b, c], [$a, $b, $c, $d, $e, $f]]
    ): [a, b, c, $a, $b, $c, $d, $e, $f],
    <a, b, c, $a, $b, $c, $d, $e, $f, $g>(
      [[a, b, c], [$a, $b, $c, $d, $e, $f, $g]]
    ): [a, b, c, $a, $b, $c, $d, $e, $f, $g],
    <a, b, c, $a, $b, $c, $d, $e, $f, $g, $h>(
      [[a, b, c], [$a, $b, $c, $d, $e, $f, $g, $h]]
    ): [a, b, c, $a, $b, $c, $d, $e, $f, $g, $h],

    <a, b, c, d, $a>([[a, b, c, d], [$a]]): [a, b, c, d, $a],
    <a, b, c, d, $a, $b>([[a, b, c, d], [$a, $b]]): [a, b, c, d, $a, $b],
    <a, b, c, d, $a, $b, $c>(
      [[a, b, c, d], [$a, $b, $c]]
    ): [a, b, c, d, $a, $b, $c],
    <a, b, c, d, $a, $b, $c, $d>(
      [[a, b, c, d], [$a, $b, $c, $d]]
    ): [a, b, c, d, $a, $b, $c, $d],
    <a, b, c, d, $a, $b, $c, $d, $e>(
      [[a, b, c, d], [$a, $b, $c, $d, $e]]
    ): [a, b, c, d, $a, $b, $c, $d, $e],
    <a, b, c, d, $a, $b, $c, $d, $e, $f>(
      [[a, b, c, d], [$a, $b, $c, $d, $e, $f]]
    ): [a, b, c, d, $a, $b, $c, $d, $e, $f],
    <a, b, c, d, $a, $b, $c, $d, $e, $f, $g>(
      [[a, b, c, d], [$a, $b, $c, $d, $e, $f, $g]]
    ): [a, b, c, d, $a, $b, $c, $d, $e, $f, $g],
    <a, b, c, d, $a, $b, $c, $d, $e, $f, $g, $h>(
      [[a, b, c, d], [$a, $b, $c, $d, $e, $f, $g, $h]]
    ): [a, b, c, d, $a, $b, $c, $d, $e, $f, $g, $h],

    <a, b, c, d, e, $a>([[a, b, c, d, e], [$a]]): [a, b, c, d, e, $a],
    <a, b, c, d, e, $a, $b>(
      [[a, b, c, d, e], [$a, $b]]
    ): [a, b, c, d, e, $a, $b],
    <a, b, c, d, e, $a, $b, $c>(
      [[a, b, c, d, e], [$a, $b, $c]]
    ): [a, b, c, d, e, $a, $b, $c],
    <a, b, c, d, e, $a, $b, $c, $d>(
      [[a, b, c, d, e], [$a, $b, $c, $d]]
    ): [a, b, c, d, e, $a, $b, $c, $d],
    <a, b, c, d, e, $a, $b, $c, $d, $e>(
      [[a, b, c, d, e], [$a, $b, $c, $d, $e]]
    ): [a, b, c, d, e, $a, $b, $c, $d, $e],
    <a, b, c, d, e, $a, $b, $c, $d, $e, $f>(
      [[a, b, c, d, e], [$a, $b, $c, $d, $e, $f]]
    ): [a, b, c, d, e, $a, $b, $c, $d, $e, $f],
    <a, b, c, d, e, $a, $b, $c, $d, $e, $f, $g>(
      [[a, b, c, d, e], [$a, $b, $c, $d, $e, $f, $g]]
    ): [a, b, c, d, e, $a, $b, $c, $d, $e, $f, $g],
    <a, b, c, d, e, $a, $b, $c, $d, $e, $f, $g, $h>(
      [[a, b, c, d, e], [$a, $b, $c, $d, $e, $f, $g, $h]]
    ): [a, b, c, d, e, $a, $b, $c, $d, $e, $f, $g, $h],

    <a, b, c, d, e, f, $a>([[a, b, c, d, e, f], [$a]]): [a, b, c, d, e, f, $a],
    <a, b, c, d, e, f, $a, $b>(
      [[a, b, c, d, e, f], [$a, $b]]
    ): [a, b, c, d, e, f, $a, $b],
    <a, b, c, d, e, f, $a, $b, $c>(
      [[a, b, c, d, e, f], [$a, $b, $c]]
    ): [a, b, c, d, e, f, $a, $b, $c],
    <a, b, c, d, e, f, $a, $b, $c, $d>(
      [[a, b, c, d, e, f], [$a, $b, $c, $d]]
    ): [a, b, c, d, e, f, $a, $b, $c, $d],
    <a, b, c, d, e, f, $a, $b, $c, $d, $e>(
      [[a, b, c, d, e, f], [$a, $b, $c, $d, $e]]
    ): [a, b, c, d, e, f, $a, $b, $c, $d, $e],
    <a, b, c, d, e, f, $a, $b, $c, $d, $e, $f>(
      [[a, b, c, d, e, f], [$a, $b, $c, $d, $e, $f]]
    ): [a, b, c, d, e, f, $a, $b, $c, $d, $e, $f],
    <a, b, c, d, e, f, $a, $b, $c, $d, $e, $f, $g>(
      [[a, b, c, d, e, f], [$a, $b, $c, $d, $e, $f, $g]]
    ): [a, b, c, d, e, f, $a, $b, $c, $d, $e, $f, $g],
    <a, b, c, d, e, f, $a, $b, $c, $d, $e, $f, $g, $h>(
      [[a, b, c, d, e, f], [$a, $b, $c, $d, $e, $f, $g, $h]]
    ): [a, b, c, d, e, f, $a, $b, $c, $d, $e, $f, $g, $h],

    <a, b, c, d, e, f, g, $a>(
      [[a, b, c, d, e, f, g], [$a]]
    ): [a, b, c, d, e, f, g, $a],
    <a, b, c, d, e, f, g, $a, $b>(
      [[a, b, c, d, e, f, g], [$a, $b]]
    ): [a, b, c, d, e, f, g, $a, $b],
    <a, b, c, d, e, f, g, $a, $b, $c>(
      [[a, b, c, d, e, f, g], [$a, $b, $c]]
    ): [a, b, c, d, e, f, g, $a, $b, $c],
    <a, b, c, d, e, f, g, $a, $b, $c, $d>(
      [[a, b, c, d, e, f, g], [$a, $b, $c, $d]]
    ): [a, b, c, d, e, f, g, $a, $b, $c, $d],
    <a, b, c, d, e, f, g, $a, $b, $c, $d, $e>(
      [[a, b, c, d, e, f, g], [$a, $b, $c, $d, $e]]
    ): [a, b, c, d, e, f, g, $a, $b, $c, $d, $e],
    <a, b, c, d, e, f, g, $a, $b, $c, $d, $e, $f>(
      [[a, b, c, d, e, f, g], [$a, $b, $c, $d, $e, $f]]
    ): [a, b, c, d, e, f, g, $a, $b, $c, $d, $e, $f],
    <a, b, c, d, e, f, g, $a, $b, $c, $d, $e, $f, $g>(
      [[a, b, c, d, e, f, g], [$a, $b, $c, $d, $e, $f, $g]]
    ): [a, b, c, d, e, f, g, $a, $b, $c, $d, $e, $f, $g],
    <a, b, c, d, e, f, g, $a, $b, $c, $d, $e, $f, $g, $h>(
      [[a, b, c, d, e, f, g], [$a, $b, $c, $d, $e, $f, $g, $h]]
    ): [a, b, c, d, e, f, g, $a, $b, $c, $d, $e, $f, $g, $h],

    <a, b, c, d, e, f, g, h, $a>(
      [[a, b, c, d, e, f, g, h], [$a]]
    ): [a, b, c, d, e, f, g, h, $a],
    <a, b, c, d, e, f, g, h, $a, $b>(
      [[a, b, c, d, e, f, g, h], [$a, $b]]
    ): [a, b, c, d, e, f, g, h, $a, $b],
    <a, b, c, d, e, f, g, h, $a, $b, $c>(
      [[a, b, c, d, e, f, g, h], [$a, $b, $c]]
    ): [a, b, c, d, e, f, g, h, $a, $b, $c],
    <a, b, c, d, e, f, g, h, $a, $b, $c, $d>(
      [[a, b, c, d, e, f, g, h], [$a, $b, $c, $d]]
    ): [a, b, c, d, e, f, g, h, $a, $b, $c, $d],
    <a, b, c, d, e, f, g, h, $a, $b, $c, $d, $e>(
      [[a, b, c, d, e, f, g, h], [$a, $b, $c, $d, $e]]
    ): [a, b, c, d, e, f, g, h, $a, $b, $c, $d, $e],
    <a, b, c, d, e, f, g, h, $a, $b, $c, $d, $e, $f>(
      [[a, b, c, d, e, f, g, h], [$a, $b, $c, $d, $e, $f]]
    ): [a, b, c, d, e, f, g, h, $a, $b, $c, $d, $e, $f],
    <a, b, c, d, e, f, g, h, $a, $b, $c, $d, $e, $f, $g>(
      [[a, b, c, d, e, f, g, h], [$a, $b, $c, $d, $e, $f, $g]]
    ): [a, b, c, d, e, f, g, h, $a, $b, $c, $d, $e, $f, $g],
    <a, b, c, d, e, f, g, h, $a, $b, $c, $d, $e, $f, $g, $h>(
      [[a, b, c, d, e, f, g, h], [$a, $b, $c, $d, $e, $f, $g, $h]]
    ): [a, b, c, d, e, f, g, h, $a, $b, $c, $d, $e, $f, $g, $h],
    <_>(_): empty
  }
>

export const separate = <a, b>(all: Concat<a, [b]>): [a, b] => [
  all.slice(0, all.length - 1),
  all[all.length - 1]
]

export const push = <a, b>(left: a, last: b): Concat<a, [b]> => [
  ...(left: any),
  last
]
