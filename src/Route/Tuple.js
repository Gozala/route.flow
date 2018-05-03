// @flow strict

export type Push<xs, x> = $Call<
  {
    <a, b, c, d, e, f, g, h>([]): [x],
    <a, b, c, d, e, f, g, h>([a]): [a, x],
    <a, b, c, d, e, f, g, h>([a, b]): [a, b, x],
    <a, b, c, d, e, f, g, h>([a, b, c]): [a, b, c, x],
    <a, b, c, d, e, f, g, h>([a, b, c, d]): [a, b, c, d, x],
    <a, b, c, d, e, f, g, h>([a, b, c, d, e]): [a, b, c, d, e, x],
    <a, b, c, d, e, f, g, h>([a, b, c, d, e, f]): [a, b, c, d, e, f, x],
    <a, b, c, d, e, f, g, h>([a, b, c, d, e, f, g]): [a, b, c, d, e, f, g, x],
    <a, b, c, d, e, f, g, h>(
      [a, b, c, d, e, f, g, h]
    ): [a, b, c, d, e, f, g, h, x]
  },
  xs
>

export type Concat<xs, ys> = $Call<
  {
    ([]): ys,
    <y>([y]): Push<xs, y>,
    <y, zs>(Push<zs, y>): Concat<zs, Push<xs, y>>
  },
  ys
>

export const push = <x, xs>(tuple: xs, last: x): Push<xs, x> => [
  ...(tuple: any),
  last
]

export const last = <xs, x>(tuple: Push<xs, x>): x =>
  (tuple: any)[(tuple: any).length - 1]

export const butlast = <xs, x>(tuple: Push<xs, x>): xs =>
  (tuple: any).slice(0, (tuple: any).length - 1)
