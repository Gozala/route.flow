/* @flow */

import * as URLParser from "../"
import test from "blue-tape"

test("test baisc", async test => {
  test.isEqual(typeof URLParser, "object")
  test.isEqual(typeof URLParser.root, "object")
  test.isEqual(typeof URLParser.segment, "function")
  test.isEqual(typeof URLParser.render, "function")
  test.isEqual(typeof URLParser.chain, "function")
  test.isEqual(typeof URLParser.lift, "function")

  test.isEqual(typeof URLParser.reader, "function")
  test.isEqual(typeof URLParser.string, "function")
  test.isEqual(typeof URLParser.integer, "function")

  test.isEqual(typeof URLParser.param, "function")
  test.isEqual(typeof URLParser.stringParam, "function")
  test.isEqual(typeof URLParser.integerParam, "function")

  test.isEqual(typeof URLParser.parse, "function")
  test.isEqual(typeof URLParser.parseHash, "function")
  test.isEqual(typeof URLParser.parseURL, "function")
})

test("test parser", async test => {
  const userCommentParser = URLParser.segment("user")
    .chain(URLParser.string)
    .segment("comments")
    .chain(URLParser.integer)

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

  const comment = userCommentParser.lift(Comment.new)

  test.deepEqual(
    URLParser.parse(comment, "/user/bob/comments/42"),
    new Comment("bob", 42)
  )

  test.deepEqual(URLParser.parse(comment, "/user/bob/comment/42"), null)
  test.deepEqual(
    URLParser.render(userCommentParser, "Jack", 15),
    "/user/Jack/comments/15"
  )
})
