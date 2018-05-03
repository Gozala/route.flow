/* @flow */

import * as Route from "../src/Route"
import test from "blue-tape"
import * as Integer from "integer.flow"
import * as Float from "float.flow"

test("test baisc", async test => {
  test.isEqual(typeof Route, "object")

  test.isEqual(typeof Route.String, "object")
  test.isEqual(typeof Route.Integer, "object")
  test.isEqual(typeof Route.Float, "object")

  test.isEqual(typeof Route.Root, "object")
  test.isEqual(typeof Route.segment, "function")

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

test("Route.String", async test => {
  test.deepEqual(Route.String.parsePath({ pathname: "alice" }), ["alice"])
  test.deepEqual(Route.String.parsePath({ pathname: "alice/" }), ["alice"])
  test.deepEqual(Route.String.parsePath({ pathname: "alice/blog" }), null)
  test.deepEqual(Route.String.parsePath({ pathname: "/alice" }), null)
  test.deepEqual(Route.String.parsePath({ pathname: "42" }), ["42"])

  test.deepEqual(Route.String.formatPath("hi"), "hi")
})

test("Route.Float", async test => {
  test.deepEqual(Route.Float.parsePath({ pathname: "42/" }), [42])
  test.deepEqual(Route.Float.parsePath({ pathname: "-42.5" }), [-42.5])
  test.deepEqual(Route.Float.parsePath({ pathname: "NaN/" }), null)
  test.deepEqual(Route.Float.parsePath({ pathname: "Infinity/" }), null)
  test.deepEqual(Route.Float.parsePath({ pathname: "Bob/" }), null)

  test.deepEqual(Route.Float.formatPath(Float.toFloat(42)), "42")
  test.deepEqual(Route.Float.formatPath(Float.toFloat(-42.5)), "-42.5")
})

test("Route.Integer", async test => {
  test.deepEqual(Route.parsePath(Route.Integer, { pathname: "-7" }), [-7])
  test.deepEqual(Route.parsePath(Route.Integer, { pathname: "42/" }), [42])
  test.deepEqual(Route.parsePath(Route.Integer, { pathname: "+8" }), [8])
  test.deepEqual(Route.parsePath(Route.Integer, { pathname: "42.2/" }), null)
  test.deepEqual(Route.parsePath(Route.Integer, { pathname: "/" }), null)
  test.deepEqual(Route.parsePath(Route.Integer, { pathname: "Infinity" }), null)
  test.deepEqual(Route.parsePath(Route.Integer, { pathname: "NaN/" }), null)

  test.deepEqual(Route.Integer.formatPath(Integer.truncate(7)), "7")
  test.deepEqual(Route.Integer.formatPath(Integer.truncate(-7)), "-7")
})

test("Route.Root", async test => {
  test.deepEqual(Route.Root.parsePath({ pathname: "/" }), [])
  test.deepEqual(Route.Root.parsePath({ pathname: "" }), null)
  test.deepEqual(Route.Root.parsePath({ pathname: "/foo" }), null)
  test.deepEqual(Route.Root.parsePath({ pathname: "bar" }), null)

  test.deepEqual(Route.Root.formatPath(), "/")
})

test("Route.segment", async test => {
  test.deepEqual(Route.segment("blog").parsePath({ pathname: "blog" }), [])
  test.deepEqual(Route.segment("blog").parsePath({ pathname: "blog/" }), [])
  test.deepEqual(
    Route.segment("blog").parsePath({ pathname: "blog/cat" }),
    null
  )
  test.deepEqual(Route.segment("blog").parsePath({ pathname: "/blog/" }), null)
  test.deepEqual(Route.segment("blog").parsePath({ pathname: "glob" }), null)
  test.deepEqual(Route.segment("blog").parsePath({ pathname: "/" }), null)

  test.deepEqual(Route.segment("blog").formatPath(), "blog")
})

// test("Route.concat", async test => {
//   const blogID = Route.concat(Route.segment("blog"), Route.Integer)
//   test.deepEqual(blogID.parsePath({ pathname: "blog/35/" }), [35])
//   test.deepEqual(blogID.parsePath({ pathname: "blog/42/" }), [42])
//   test.deepEqual(blogID.parsePath({ pathname: "blog/" }), null)
//   test.deepEqual(blogID.parsePath({ pathname: "42" }), null)

//   const blogSearch = Route.concat(
//     Route.segment("blog"),
//     Route.segment("search")
//   )
//   const searchTerm = Route.concat(blogSearch, Route.String)

//   test.deepEqual(searchTerm.parsePath({ pathname: "blog/search/cats/" }), [
//     "cats"
//   ])
//   test.deepEqual(searchTerm.parsePath({ pathname: "blog/search/42/" }), ["42"])
//   test.deepEqual(searchTerm.parsePath({ pathname: "/search/cats/" }), null)
//   test.deepEqual(searchTerm.parsePath({ pathname: "/blog/cats/" }), null)
// })

test("(route:Route<a>).segment(string):Route<a>", async test => {
  test.deepEqual(Route.Root.segment("blog").parsePath({ pathname: "/" }), null)

  test.deepEqual(
    Route.Root.segment("blog").parsePath({ pathname: "/blog" }),
    []
  )
  test.deepEqual(Route.Root.segment("blog").formatPath(), "/blog")

  test.deepEqual(
    Route.Float.segment("inc").parsePath({ pathname: "cat/inc" }),
    null
  )
  test.deepEqual(Route.Float.segment("inc").parsePath({ pathname: "7/inc" }), [
    7
  ])

  test.deepEqual(
    Route.Float.segment("inc").formatPath(Float.toFloat(7)),
    "7/inc"
  )
})

test("(route:Route<a>).param(RouteParam<[b]>):Route<Concat<a,[b]>>", async test => {
  const calculator = Route.Root.segment("calculator")
    .param(Route.Float)
    .segment("+")
    .param(Route.Float)

  test.deepEqual(calculator.parsePath({ pathname: "/calculator/313/+/3" }), [
    313,
    3
  ])
  test.deepEqual(calculator.parsePath({ pathname: "/calculator/313/+/" }), null)
  test.deepEqual(calculator.parsePath({ pathname: "/calculator/13/+/4.2/" }), [
    13,
    4.2
  ])

  test.deepEqual(
    calculator.formatPath(Float.toFloat(8), Float.toFloat(9)),
    "/calculator/8/+/9"
  )
})

// test("(route:Route<a>).concat<b>(Route<b>):Route<Concat<a, b>>", async test => {
//   const blogPosts = Route.Root.segment("blog")
//   const postID = Route.segment("post").param(Route.Integer)
//   const blogPostID = blogPosts.concat(postID)

//   test.deepEqual(blogPostID.parsePath({ pathname: "/blog/post/35/" }), [35])
//   test.deepEqual(blogPostID.parsePath({ pathname: "/post/42/" }), null)
//   test.deepEqual(blogPostID.parsePath({ pathname: "blog/post/7" }), null)
//   test.deepEqual(blogPostID.parsePath({ pathname: "/blog/post/" }), null)
//   test.deepEqual(blogPostID.formatPath(Integer.truncate(17)), "/blog/post/17")

//   const search = Route.concat(Route.segment("blog"), Route.segment("search"))
//   const term = Route.concat(search, Route.String)

//   test.deepEqual(term.parsePath({ pathname: "blog/search/cats/" }), ["cats"])
//   test.deepEqual(term.parsePath({ pathname: "blog/search/42/" }), ["42"])
//   test.deepEqual(term.parsePath({ pathname: "/search/cats/" }), null)
//   test.deepEqual(term.parsePath({ pathname: "/blog/cats/" }), null)

//   test.deepEqual(term.formatPath("dog"), "blog/search/dog")
// })

test("param<a>(string => ?a, a => string):RouteParam<a>", async test => {
  const css = Route.param(
    ($: string): ?string => ($.endsWith(".css") ? $ : null),
    String
  )

  test.deepEqual(css.parsePath({ pathname: "base.css" }), ["base.css"])
  test.deepEqual(css.parsePath({ pathname: "fontawesome-webfont.woff2" }), null)
  test.deepEqual(css.parsePath({ pathname: "style/base.css" }), null)
  test.deepEqual(css.formatPath("util.css"), "util.css")

  const stylesheet = Route.Root.segment("style").param(css)

  test.deepEqual(stylesheet.parsePath({ pathname: "/style/base.css" }), [
    "base.css"
  ])
  test.deepEqual(stylesheet.parsePath({ pathname: "base.css" }), null)
  test.deepEqual(stylesheet.parsePath({ pathname: "style/base.css" }), null)
  test.deepEqual(stylesheet.parsePath({ pathname: "/style/font.woff2" }), null)
  test.deepEqual(stylesheet.formatPath("util.css"), "/style/util.css")
})

test("query<b>(string, RouteParam<a>):Route<[a]>", async test => {
  const limit = Route.query("limit", Route.Integer)
  test.deepEqual(limit.parsePath({ search: "?limit=5" }), [5])
  test.deepEqual(limit.parsePath({ search: "?limit=" }), null)
  test.deepEqual(limit.parsePath({ search: "?limit=0" }), [0])
  test.deepEqual(limit.parsePath({ search: "?foo&bar&limit=2" }), [2])
  test.deepEqual(limit.formatPath(Integer.truncate(56)), "?limit=56")

  const find = Route.segment("find")
    .param(Route.String)
    .var(limit)

  test.deepEqual(find.parsePath({ search: "?limit=5" }), null)
  test.deepEqual(find.parsePath({ pathname: "find", search: "?limit=5" }), null)
  test.deepEqual(find.parsePath({ pathname: "find/cat", search: "?limit=5" }), [
    "cat",
    5
  ])
  test.deepEqual(
    find.parsePath({ pathname: "find/cat", search: "?limit=5&sort=asc" }),
    ["cat", 5]
  )
  test.deepEqual(
    find.formatPath("dog", Integer.truncate(12)),
    "find/dog?limit=12"
  )
})

test("(p:Route<a>).query(string, RouteParam<b>):Route<Concat<a, b>>", async test => {
  const seek = Route.Root.segment("seek")
    .param(Route.String)
    .query("limit", Route.Integer)

  test.deepEqual(seek.parsePath({ search: "?limit=5" }), null)
  test.deepEqual(
    seek.parsePath({ pathname: "/seek", search: "?limit=5" }),
    null
  )
  test.deepEqual(
    seek.parsePath({ pathname: "/seek/cat", search: "?limit=5" }),
    ["cat", 5]
  )

  test.deepEqual(
    seek.formatPath("follower", Integer.truncate(3)),
    "/seek/follower?limit=3"
  )
})

test("formatPath<a>(Route<a>, ...a):string", async test => {
  test.deepEqual(
    Route.formatPath(Route.segment("find").param(Route.String), "cats"),
    "find/cats"
  )

  test.deepEqual(
    Route.formatPath(
      Route.Root.segment("blog")
        .param(Route.String)
        .segment("tag")
        .param(Route.String)
        .segment(),
      "cats",
      "breed"
    ),
    "/blog/cats/tag/breed/"
  )

  const search = Route.Root.segment("search")
    .param(Route.String)
    .query("limit", Route.Integer)
    .query("sort", Route.String)

  test.deepEqual(
    Route.formatPath(search, "cat", Integer.truncate(50), "asc"),
    "/search/cat?sort=asc&limit=50"
  )
})

test("(route:Route<a>).formatPath(...a):string", async test => {
  test.deepEqual(
    Route.segment("find")
      .param(Route.String)
      .formatPath("cats"),
    "find/cats"
  )

  test.deepEqual(
    Route.Root.segment("blog")
      .param(Route.String)
      .segment("tag")
      .param(Route.String)
      .segment()
      .formatPath("cats", "breed"),
    "/blog/cats/tag/breed/"
  )

  const search = Route.Root.segment("search")
    .param(Route.String)
    .query("limit", Route.Integer)
    .query("sort", Route.String)

  test.deepEqual(
    Route.Root.segment("search")
      .param(Route.String)
      .query("limit", Route.Integer)
      .query("sort", Route.String)
      .formatPath("cat", Integer.truncate(5), "asc"),
    "/search/cat?sort=asc&limit=5"
  )
})

test("formatHash<a>(Route<a>, ...a):string", async test => {
  test.deepEqual(
    Route.formatHash(Route.segment("find").param(Route.String), "cats"),
    "#find/cats"
  )

  test.deepEqual(
    Route.formatHash(
      Route.Root.segment("blog")
        .param(Route.String)
        .segment("tag")
        .param(Route.String)
        .segment(),
      "cats",
      "breed"
    ),
    "#/blog/cats/tag/breed/"
  )

  const search = Route.Root.segment("search")
    .param(Route.String)
    .query("limit", Route.Integer)
    .query("sort", Route.String)

  test.deepEqual(
    Route.formatHash(search, "cat", Integer.truncate(50), "asc"),
    "#/search/cat?sort=asc&limit=50"
  )
})

test("(route:Route<a>).formatHash(...a):string", async test => {
  test.deepEqual(
    Route.segment("find")
      .param(Route.String)
      .formatHash("cats"),
    "#find/cats"
  )

  test.deepEqual(
    Route.Root.segment("blog")
      .param(Route.String)
      .segment("tag")
      .param(Route.String)
      .segment()
      .formatHash("cats", "breed"),
    "#/blog/cats/tag/breed/"
  )
})

test("format<a>(Route<a>, ...a):URL", async test => {
  test.deepEqual(
    Route.format(
      Route.segment("find")
        .param(Route.String)
        .query("sort", Route.String),
      "cats",
      ""
    ),
    { pathname: "find/cats", search: "?sort", hash: "" }
  )

  test.deepEqual(
    Route.format(
      Route.Root.segment("blog")
        .param(Route.String)
        .segment("tag")
        .param(Route.String)
        .segment(),
      "cats",
      "breed"
    ),
    { pathname: "/blog/cats/tag/breed/", search: "", hash: "" }
  )
})

test("(route:Route<a>).format(...a):URL", async test => {
  test.deepEqual(
    Route.segment("find")
      .param(Route.String)
      .query("sort", Route.String)
      .format("cats", "color"),
    { pathname: "find/cats", search: "?sort=color", hash: "" }
  )

  test.deepEqual(
    Route.Root.segment("blog")
      .param(Route.String)
      .segment("tag")
      .param(Route.String)
      .segment()
      .format("cats", "breed"),
    { pathname: "/blog/cats/tag/breed/", search: "", hash: "" }
  )
})

test("trailing seperator", async test => {
  const relativeFind = Route.segment("find")
    .param(Route.String)
    .segment()

  test.deepEqual(relativeFind.parsePath({ pathname: "find/cat" }), null)
  test.deepEqual(relativeFind.parsePath({ pathname: "find/cat/" }), ["cat"])
  test.deepEqual(relativeFind.formatPath("job"), "find/job/")

  const absoluteFind = Route.Root.segment("find")
    .param(Route.String)
    .segment()

  test.deepEqual(absoluteFind.parsePath({ pathname: "/find/cat" }), null)
  test.deepEqual(absoluteFind.parsePath({ pathname: "/find/cat/" }), ["cat"])
  test.deepEqual(absoluteFind.formatPath("dog"), "/find/dog/")
})
