/* @flow */

import * as URLParser from "../"
import test from "blue-tape"
import * as Integer from "integer.flow"

test("test baisc", async test => {
  test.isEqual(typeof URLParser, "object")
  test.isEqual(typeof URLParser.Root, "object")
  test.isEqual(typeof URLParser.segment, "function")
  test.isEqual(typeof URLParser.format, "function")
  test.isEqual(typeof URLParser.append, "function")

  test.isEqual(typeof URLParser.paramParser, "function")
  test.isEqual(typeof URLParser.String, "object")
  test.isEqual(typeof URLParser.Integer, "object")
  test.isEqual(typeof URLParser.Float, "object")

  test.isEqual(typeof URLParser.query, "function")
  test.isEqual(typeof URLParser.parse, "function")
  test.isEqual(typeof URLParser.parseHash, "function")
  test.isEqual(typeof URLParser.parsePath, "function")
})

test("test parser", async test => {
  const userCommentParser = URLParser.segment("user")
    .param(URLParser.String)
    .segment("comments")
    .param(URLParser.Integer)

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

  test.deepEqual(
    URLParser.parse(
      userCommentParser,
      "/user/bob/comments/42",
      {},
      Comment.new
    ),
    new Comment("bob", 42)
  )

  test.deepEqual(
    URLParser.parse(userCommentParser, "/user/bob/comment/42", {}, Comment.new),
    null
  )

  test.deepEqual(
    URLParser.format(userCommentParser, "Jack", Integer.truncate(15)),
    "/user/Jack/comments/15"
  )
})
