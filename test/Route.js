/* @flow */

import * as Route from "../"
import test from "blue-tape"
import * as Integer from "integer.flow"

test("test baisc", async test => {
  test.isEqual(typeof Route, "object")

  test.isEqual(typeof Route.String, "object")
  test.isEqual(typeof Route.Integer, "object")
  test.isEqual(typeof Route.Float, "object")

  test.isEqual(typeof Route.Root, "object")
  test.isEqual(typeof Route.segment, "function")

  test.isEqual(typeof Route.concat, "function")
  test.isEqual(typeof Route.param, "function")
  test.isEqual(typeof Route.query, "function")

  test.isEqual(typeof Route.parse, "function")
  test.isEqual(typeof Route.parsePath, "function")
  test.isEqual(typeof Route.parseHash, "function")

  test.isEqual(typeof Route.format, "function")
  test.isEqual(typeof Route.formatPath, "function")
  test.isEqual(typeof Route.formatHash, "function")
})

test("test route", async test => {
  const userComment = Route.segment("user")
    .param(Route.String)
    .segment("comments")
    .param(Route.Integer)

  test.deepEqual(
    Route.parsePath(userComment, { pathname: "user/bob/comments/42" }),
    ["bob", 42]
  )

  test.deepEqual(
    Route.parsePath(userComment, { pathname: "/user/bob/comment/42" }),
    null
  )

  test.deepEqual(
    Route.formatPath(userComment, "Jack", Integer.truncate(15)),
    "user/Jack/comments/15"
  )
})
