/* @flow */

import * as Route from "../"
import test from "blue-tape"
import * as Integer from "integer.flow"

test("test baisc", async test => {
  test.isEqual(typeof Route, "object")
  test.isEqual(typeof Route.Root, "object")
  test.isEqual(typeof Route.segment, "function")
  test.isEqual(typeof Route.format, "function")
  test.isEqual(typeof Route.concat, "function")

  test.isEqual(typeof Route.param, "function")
  test.isEqual(typeof Route.String, "object")
  test.isEqual(typeof Route.Integer, "object")
  test.isEqual(typeof Route.Float, "object")

  test.isEqual(typeof Route.query, "function")
  test.isEqual(typeof Route.parse, "function")
  test.isEqual(typeof Route.parseHash, "function")
  test.isEqual(typeof Route.parsePath, "function")
})

test("test route", async test => {
  const userCommentCodec = Route.segment("user")
    .param(Route.String)
    .segment("comments")
    .param(Route.Integer)

  class Comment {
    name: string
    id: number
    static new(name: string, id: number): Comment {
      return new Comment(name, id)
    }
    constructor(name: string, id: number) {
      this.name = name
      this.id = id
    }
  }

  test.deepEqual(Route.parse(userCommentCodec, "/user/bob/comments/42", {}), [
    "bob",
    42
  ])

  test.deepEqual(
    Route.parse(userCommentCodec, "/user/bob/comment/42", {}),
    null
  )

  test.deepEqual(
    Route.format(userCommentCodec, "Jack", Integer.truncate(15)),
    "/user/Jack/comments/15"
  )
})
