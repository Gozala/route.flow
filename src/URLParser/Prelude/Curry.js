/* @flow */

import type { Lift } from "./Lift"

type Curry<f> = Lift<
  f,
  {
    <x>(() => x): () => x,
    <x, a>((a) => x): a => x,
    <x, a, b>((a, b) => x): a => b => x,
    <x, a, b, c>((a, b, c) => x): a => b => c => x,
    <x, a, b, c, d>((a, b, c, d) => x): a => b => c => d => x,
    <x, a, b, c, d, e>((a, b, c, d, e) => x): a => b => c => d => e => x,
    <x, a, b, c, d, e, f>(
      (a, b, c, d, e, f) => x
    ): a => b => c => d => e => f => x,
    <x, a, b, c, d, e, f, g>(
      (a, b, c, d, e, f, g) => x
    ): a => b => c => d => e => f => g => x,
    <x, a, b, c, d, e, f, g, h>(
      (a, b, c, d, e, f, g, h) => x
    ): a => b => c => d => e => f => g => h => x,
    <_>(_): empty
  }
>

export const curry = <fn: Function>(call: fn): Curry<fn> => {
  if (call.curry) {
    return call.curry
  } else {
    switch (call.length) {
      case 0:
        return (call.curry = call)
      case 1:
        return (call.curry = call)
      case 2: {
        return (call.curry = a => b => call(a, b))
      }
      case 3: {
        return (call.curry = a => b => c => call(a, b, c))
      }
      case 4: {
        return (call.curry = a => b => c => d => call(a, b, c, d))
      }
      case 5: {
        return (call.curry = a => b => c => d => e => call(a, b, c, d, e))
      }
      case 6: {
        return (call.curry = a => b => c => d => e => f =>
          call(a, b, c, d, e, f))
      }
      case 7: {
        return (call.curry = a => b => c => d => e => f => g =>
          call(a, b, c, d, e, f, g))
      }
      case 8: {
        return (call.curry = a => b => c => d => e => f => g => h =>
          call(a, b, c, d, e, f, g, h))
      }
      default: {
        throw TypeError(`Funciton arity not supported`)
      }
    }
  }
}
