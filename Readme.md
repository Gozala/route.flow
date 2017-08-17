# route.flow
[![travis][travis.icon]][travis.url]
[![package][version.icon] ![downloads][downloads.icon]][package.url]
[![styled with prettier][prettier.icon]][prettier.url]



Library provides low-level API for type safe routing, addressing two primary concerns:

1. Parsing

   Type safe parseing of routes - Extracting (typed) parameters so that type checker (in this instance [Flow][]) is able to report any missuse.

2. Linking / Formatting

   Type safe formating of hyper links - Type checker is able to report if any parameter is missing or mystyed.



## The problem

Here is a simlpe example that uses a routing system of [Express][express routing] web framework for [Node.js][]:


> **Disclaimer:** There is no intention to diminish or crticize [Express][], it's an excellent library. As a matter of fact pointed out shortcomings are shortcomings of an untyped nature of JS, which is what [Express][] is tailored for.
>
> That being said, raise of type checkers for JS like [Flow][] & [TypeScript][] provides an excellent opportunities and there is no better way to illustrate them than to compare it to an established solution.


```js
const express = require("express")
const app = express()

app.get("/", (request, response) => {
  response.send(`<a href='/calculator/313/+/3'>Calculate 313 + 3</a>`)
})

app.get("/calculator/:a/+/:b", (request, response) => {
  const {a, b} = request.params
  response.send(`${parseFloat(a) + parseFloat(b)}\n`)
})
```

> **Note:** [Express][] does not actually allow `/+/` path segments, and you would have to use `/plus/` instead, but for the sake of this example lets prentend it does

#### Parsing

There are multiple issues with this approach, which can lead to mistakes that can sneak into production:

- Handling of parameters in routes is too repetitive.

   Declaring a route parameter requires choose a name, which you must later repeat to get it from `request.params`. Mistyping the name of the parameter is a mistake which is not caught by the type checker (even if it is used). It is just too easy to make changes which would update names in some places and not other causing program to misbehave.

- Request handler needs to parse route parameters.

   All parameter values are passed as strings to a handler, which then needs to parse them, handling all possible edge cases (In our example `/calculator/313/+/bob` would respond with `NaN` :)

#### Linking

Even if we manage to keep parameter nameing in sync across the code base and excell at parsing their values, there still more that could go wrong:

- Route changes affect hyper links.

  Let's say we had to switch to prefix notation for our calculator and switched from URLs like `/calculator/313/+/3` to `/calculator/plus/313/3` it's just too easy to forget to update a link in our `/` route.

## Solution

> **Note:** Example below is more verbose than one above, but that is because it is meant to illustrate low-level API provided by this library, which is more of a building block for something like [Express][]. It is also worth noting that API of this library is designed towards taking advantage of type system that does not quite fit [Express][] API and that shows


```js
import * as Route from "route.flow"
import * as URL from "url"
import express from "express"

const index = Route.Root
const calculator = index
  .segment("calculator")
  .param(Route.Float)
  .segment("+")
  .param(Route.Float)

const getIndex = response =>
  response.send(`<a href='${plusRoute.formatPath(313, 3)}'>Calculate 313 + 3</a>`)

const getCalculator = (response, a: number, b: number) =>
  response.send(`${a + b}`)

const app = express()
app.use((request, response) => {
  const url = URL.parse(request.url)

  const indexParams = index.parsePath(url)
  if (indexParams) {
    return getIndex(request, ...indexParams)
  }

  const calculatorParams = calculator.parsePath(url)
  if (calculatorParams) {
    return getCalculator(res, ...calculatorParams)
  }
})
```


Presented solution attempts to illustrate building blocks from this library for structuring routes that can be used for:

1. Parsing route parameters in a type safe way.

   Type checker ([Flow][]) can ensure that there is no missmatch between extracted parameters and handlers (`getIndex`, `getCalculator`) using them.
   
   > **Note:** In this specific examlpe [Flow][] will not complain if handler is passed less parameters than it expects due to the way it handles [function subtyping][] rules. That being said, this library comes with solution to address that and ensure that extracted number of parameters matches of what handler expects, it's just seemed little too much for this example.

2. Format hyper-links in type safe way.

   Links are formated by calling `.format(313, 3)` on the route itself allowing type checker to report any missmatch in type or number of parameters passed.

This elliminates all of the problems pointed out with original example:

- No way to mistype parameter names, at least not without type checker reporting that as an error.
- No need to parse route parameters as our routes are typed parsers already.
  > **Note:** Route as presented in the example won't match `/calculator/313/+/bob` since `bob` is not a `float`).

- Route changes will not break links.

  Links are formatted from the routes themselves, so if number or order of parameters changes type checker will be at your service and tell you all the places you need to update. For example if we update our routing to prefix notation only our route definition will change & all the links will continue to work as expected:
  
  ```diff
  const calculator = index
    .segment("calculator")
  +  .segment("plus")
     .param(Route.Float)
  -  .segment("+")
     .param(Route.Float)
  ```


## Usage

### Import

Rest of the the document & provided code examples assumes that library is installed (with yarn or npm) and imported as follows:

```js
import * as Route from "route.flow"
```

### Type Signatures

This section explains how to read some of the common type signatures used across this library.

> **Note:** Feel free to skip to the [next section](#Primitives)this is not necessary to undestanding how this library works. In fact if you're new to the type systems it's recommended to skip as this can be overhelming and discouraging.

#### `Route<a>`

The core concept in this library is a `Route` which can parse URLs like `/blog/42/cat-herding-techniques` into typed data and format it back.

Type signature `Route<a>` tells you that this route on successful parse returns data of type `a` and that this route can format data of type `a` back to URL.

> **Note:** In practice generic `a` is always going to be a tuple of paramaters route containst. For all primitive routes `a` is going to be `[b]` implying that route contains single parameter of type `b`. For static routes with no parameters `a` will be `[]`. In all other instances `Route<a>` will be comprised of other rotues and have `a` like `Concat<Concat<[],[integer]>,[string]>` which is equivalent of `[integer, string]` implying that route contains of one static segment and two parameters: `integer` and `string` parameters.

#### `RouteSegment`

It is just a type alias for `Route<[]>` and is used to represent a static segments of the route.


#### `RouteParam<a>`

As a name suggestest it's a type representing a single parameter of the route. It is a subtype of `Route<[a]>` and all primitives in this library are represented with it.

> **Note**: `RouteParam<a>` is a subtype of `Route<[a]>` but it's not an alias, meaning you can use former in place of later but not other way round. For examlpe `Route<Concat<[], Concat<[], string>>>` is equivalent of `Route<[string]>`, but unlike `RouteParam<string>` it is comprised of two static segments and one parameter. In this example `Route<[string]>` coulde be a route like `/blog/tag/:tagname` while `RouteParam<string>` would be `:tagname`


#### `URL`

Library exports `URL` type, that `Route` instances parse to extract pramaters.

```js
type URL = {
  pathname?:string,
  search?:string,
  hash?:string,
  tostring():string
}
```

> **Note**: `URL` type is compatible with [`document.location`][Location] and [`URL` instances in Node.js][Node URL] so that they could be used out of the box.


### Parsing

#### `parsePath<a>(Route<a>, URL):?a`

Parses given `URL` based on `pathname` and `search` properties, completely ignoring the `hash` property. If `URL` is a matched returns tuple `a` otherwise returns `null`.

```js
Route.parsePath(route, document.location)
```

#### `(route:Route<a>).parsePath(URL):?a`

For convenience `parsePath` is also exposed as method on `Route` instences:

```js
route.parsePath(document.location)
```

#### `parseHash<a>(Route<a>, URL):?a`

Parse given `URL` based on `hash` and `search` properties, completely ignoring the `pathname` property. If `URL` is a matched returns tuple `a` otherwise returns `null`.

> **Note** This is mostly for client side web apps that use `hash` based routing.

```js
Route.parseHash(route, document.location)
```

#### `(route:Route<a>).parsePath(URL):?a`

For convenience `parseHash` is also exposed as method on route instences:

```js
route.parseHash(document.location)
```

### Primitives


#### `String:RouteParam<string>`

Route that parses / formats a segment of the path (or a query parameter) as a tuple with a single `string` type item:

```js
Route.String.parsePath({pathname:"alice"}) //> ["alice"]
Route.String.parsePath({pathname:"alice/"}) //> ["alice"]
Route.String.parsePath({pathname:"alice/blog"}) //> null
Route.String.parsePath({pathname: "/alice"}) //> null
Route.String.parsePath({pathname:"42"}) //> ["42"]
```

#### `Float:RouteParam<float>`

Route that parses / formats a segment of the path (or a query param) as a tuple with a single `float` type item.

>**Note:**  `float` is a subtype of `number` exposed as an [opquae type alias][] from [float.flow][] library. `Float` route will not parse segments like `"NaN"` and `"Infinity"`, or in other words it is guaranteed that parsed parameter will be a finite number.

```js
Route.Float.parsePath({pathname:"42/"}) //> [42]
Route.Float.parsePath({pathname:"-42.5/"}) //> [-42.5]
Route.Float.parsePath({pathname:"NaN/"}) //> null
Route.Float.parsePath({pathname:"Infinity/"}) //> null
Route.Float.parsePath({pathname:"Bob/"}) //> null
```
> **Note:** For convinience library also exports `float` type, but as `number` subtype it can be treated as such.


#### `Integer:RouteParam<integer>`

Parser that parses a segment of the path (or a query param) as tuple with a single `integer` item.

> **Note**: `integer` is subtype of `number` exposed as an [opquae type alias][] from [integer.flow][] library. `Integer` route will not parse segments like `"NaN"`, `"Infinity"` or any floating point number, or more simply it is guaranteed that parsed parameter will be an integer number.

```js
Route.parsePath(Route.Integer, {pathname:"42/"}) //> [42]
Route.parsePath(Route.Integer, {pathname:"-7"}) //> [-7]
Route.parsePath(Route.Integer, {pathname:"+8"}) //> [8]
Route.parsePath(Route.Integer, {pathname:"42.2/"}) //> null
Route.parsePath(Route.Integer, {pathname:"/"}) //> null
Route.parsePath(Route.Integer, {pathname:"Infinity"}) //> null
Route.parsePath(Route.Integer, {pathname:"NaN/"}) //> null
```

> **Note:** For convinience also `integer` type, but as `number` subtype it can be treated as such.


#### `Root:RouteSegment`

Paramatelsess route that only matches the root and extracts no parameters hence `[]` or fails

```js
Route.Root.parsePath({pathname:"/"}) //> []
Route.Root.parsePath({pathname:""}) //> null
Route.Root.parsePath({pathname:"/foo"}) //> null
Route.Root.parsePath({pathname:"bar"}) //> null
```

> **Note:** Primary use case for `Route.Root` is to provide a foundation for building up absolute path routes.


#### `segment(string):RouteSegment`

Creates a parametless route that consumes segment of the `URL` if it is equal to passed string and extract no paramters hence `[]` or fails.

```js
Route.segment("blog").parsePath({pathname:"blog"}) //> []
Route.segment("blog").parsePath({pathname:"blog/"}) //> []
Route.segment("blog").parsePath({pathname:"blog/cat"}) //> null
Route.segment("blog").parsePath({pathname:"/blog/"}) //> null
Route.segment("blog").parsePath({pathname:"glob"}) //> null
Route.segment("blog").parsePath({pathname:"/"}) //> null
```


### Combinators

#### `concat <a, b> (Route<a>, Route<b>):Route<Concat<a, b>>`

Takes two routes and combines them into one that parses first part with first left route and rest with the right route returning concatination of their parameters when seccesfull.

```js
const blogID = Route.concat(Route.segment("blog"), Route.Integer)
blogID.parsePath({pathname:"blog/35/"}) //> [35]
blogID.parsePath({pathname:"blog/42/"}) //> [42]
blogID.parsePath({pathname:"blog/"}) //> null
blogID.parsePath({pathname:"42"}) //> null
```
> **Note** Parsers passed can and often is going to be, a concatination as well.

```js
const blogSearch = Route.concat(Route.segment("blog"), Route.segment("search"))
const searchTerm = Route.concat(blogSearch, Route.String)

searchTerm.parsePath({pathname:"blog/search/cats/"}) //> ["cats"]
searchTerm.parsePath({pathname:"blog/search/42/"}) //> ["42"]
searchTerm.parsePath({pathname:"/search/cats/"}) //> null
searchTerm.parsePath({pathname:"/blog/cats/"}) //> null
```

#### `(route:Route<a>).segment(string):Route<a>`

For convenience `segment` is also available as a method on route instences, which returns a new routes that in addition will also consumes next segment of the `URL` if it matches supplied `string`.
 

```js
Route.Root.segment("blog").parsePath({pathname:"/"}) //> null
Route.Root.segment("blog").parsePath({pathname:"/blog"}) //> []

Route.Float.segment("inc").parsePath({pathname:"cat/inc"}) //> null
Route.Float.segment("inc").parsePath({pathname:"7/inc"}) //> [7]
```

> **Note:** It is just a shortcut for concatination with a new segment:
> ```js
> const blog = Route.concat(Route.Root, Route.segment("blog"))
> blog.parsePath({pathname:"/"}) //> null
> blog.parsePath({pathname:"/blog"}) //> []
>
> const inc = Route.concat(Route.Float, Route.segment("inc"))
> inc.parsePath({pathname:"cat/inc"}) //> null
> inc.parsePath({pathname:"7/inc"}) //> [7]
> ``` 

#### `(route:Route<a>).param(RouteParam<[b]>):Route<Concat<a,[b]>>`

For convenience there is a `param` method on route instences, which returns a new routes that will in addion also parse next path segment with a supplied route.

```js
const calculator = Route.Root
  .segment("calculator")
  .param(Route.Float)
  .segment("+")
  .param(Route.Float)

calculator.parsePath({pathname:"/calculator/313/+/3"}) // [313, 3]
calculator.parsePath({pathname:"/calculator/313/+/"}) // null
calculator.parsePath({pathname:"/calculator/13/+/4.2/"}) // [13, 4.2]
```

> **Note:** It is just a shortcut for `concat` function specialized to take a `RouteParam<[a]>` rather arbitrary `Route<b>` (which is enforced by type checker).


#### `(route:Route<a>).concat<b>(Route<b>):Route<Concat<a, b>>`

For convenience there is a `concat` method on route instences

```js
const blog = Route.Root.segment("blog")
const postID = Route.segment("post").param(Route.Integer)
const blogPostID = blog.concat(postID)


blogPostID.parsePath({pathname:"/blog/post/35/"}) //> [35]
blogPostID.parsePath({pathname:"/post/42/"}) //> null
blogPostID.parsePath({pathname:"blog/post/7"}) //> null
blogPostID.parsePath({pathname:"/blog/post/"}) //> null
```
> **Note** Parsers passed can and often is going to be, a concatination as well.

```js
const blogSearch = Route.concat(Route.segment("blog"), Route.segment("search"))
const searchTerm = Route.concat(blogSearch, Route.String)

searchTerm.parsePath({pathname:"blog/search/cats/"}) //> ["cats"]
searchTerm.parsePath({pathname:"blog/search/42/"}) //> ["42"]
searchTerm.parsePath({pathname:"/search/cats/"}) //> null
searchTerm.parsePath({pathname:"/blog/cats/"}) //> null
```

#### `param<a>(string => ?a, a => string):RouteParam<a>`

Takes a **parse** function that given a string must either nothing `null|void` in which case parse fails (returns `null`) or a value of type `a` in which case parse succeeds (returns `[a]`) and **format** function which given a value `a` must return it's seralization string. 

> **Example:** Create a route that will match "only CSS files".

```js
const css = Route.param(
  ($:string):?string => $.endsWith(".css") ? $ : null,
  String
)

css.parsePath({pathname:"base.css"}) //> ["base.css"]
css.parsePath({pathname:"fontawesome-webfont.woff2"}) //> null
css.parsePath({pathname:"style/base.css"}) //> null
```

> **Note:** As with other routes you can use existing combinators to put togather something more evolved.

```js
const stylesheet = Route
  .Root
  .segment("style")
  .param(css)

stylesheet.parsePath({pathname:"/style/base.css"}) //> ["base.css"]
stylesheet.parsePath({pathname:"base.css"}) //> null
stylesheet.parsePath({pathname:"style/base.css"}) //> null
stylesheet.parsePath({pathname:"/style/font.woff2"}) //> null
```


### Query Parameters

Library also provides a way to parse and format query parameters like `?name=tom&age=42`.


#### `query<b>(string, RouteParam<a>):Route<[a]>`

Given that query parameters are named *(in contrast to path segments that are ordered)*, you need to bind a `RouteParam<a>` to name. This function does exactly that, it takes parameter name and `RouteParam<a>` and turns it into `Route<[a]>` that parses / formats query parameter for the given name.

```js
const limit = Route.query("limit", Route.Integer)
limit.parsePath({search:"?limit=5"}) //> [5]
limit.parsePath({search:"?limit="}) //> null
limit.parsePath({search:"?limit=0"}) //> [0]
limit.parsePath({search:"?foo&bar&limit=2"}) //> [2]
```

> **Note:** Since `query` returns `Route<[a]>` it can be used with all the other route combinators. In fact you can mix query and path routes.

```js
const find = Route
  .segment("find")
  .param(Route.String)
  .concat(limit)

find.parsePath({search:"?limit=5"}) //> null
find.parsePath({pathname:"/find",search:"?limit=5"}) //> null
find.parsePath({pathname:"/find/cat",search:"?limit=5"}) //> ["cat", 5]
find.parsePath({pathname:"/find/cat",search: "?limit=5&sort=asc"}) //> ["cat", 5]
```


#### `(p:Route<a>).query(string, RouteParam<b>):Route<Concat<a, b>>`

For convenience there is also `query` method on the `Route` instences, which will just concatinate it with a new query.

```js
const seek = Route.
  segment('seek').
  param(Route.String).
  query('limit', Route.Integer)

seek.parsePath({search:"?limit=5"}) //> null
seek.parsePath({pathname:"/seek",search:"?limit=5"}) //> null
seek.parsePath({pathname:"/seek/cat",search:"?limit=5"}) //> 
```

> **Note:** This is simply a shortcut for:
> ```js
> Route
>   .segment('seek')
>   .param(Route.String),
>   .concat(Route.query('limit', Route.Integer))
> ```

### Formatting

#### `formatPath<a>(Route<a>, ...a):string`

Given a `Route<a>` and parameters (`...a`) returns an appropriate `URL` string:

```js
Route.formatPath(
  Route.segment("find").param(Route.String),
  "cats"
) //> 'find/cats'

Route.formatPath(
  Route
    .Root
    .segment("blog")
    .param(Route.String)
    .segment("tag")
    .param(Route.String)
    .segment(),
  "cats",
  "breed"
) //> '/blog/cats/tag/breed/'
```


#### `(route:Route<a>).formatPath(...a):string`

For convenience `formatPath` is also exposed as method on route instences: 

```js
Route
  .segment("find")
  .param(Route.String)
  .formatPath("cats") //> 'find/cats'

Route
  .Root
  .segment("blog")
  .param(Route.String)
  .format("tag")
  .params(Route.String)
  .segment()
  .formatPath("cats", "breed") //> '/blog/cats/tag/breed/'
```

#### `formatHash<a>(Route<a>, ...a):string`

Given a `Route<a>` and parameters (`...a`) returns an appropriate `URL` string formatted as hash (convinient for client side routing)

```js
Route.formatHash(
  Route.segment("find").param(Route.String),
  "cats"
) //> '#find/cats'

Route.formatHash(
  Route
    .Root
    .segment("blog")
    .param(Route.String)
    .segment("tag")
    .param(Route.String)
    .segment(),
  "cats",
  "breed"
) //> '#/blog/cats/tag/breed/'
```


#### `(route:Route<a>).formatHash(...a):string`

For convenience `formatHash` is also exposed as method on route instences: 

```js
Route
  .segment("find")
  .param(Route.String)
  .formatHash("cats") //> '#find/cats'

Route
  .Root
  .segment("blog")
  .param(Route.String)
  .format("tag")
  .params(Route.String)
  .segment()
  .format("cats", "breed") //> '#/blog/cats/tag/breed/'
```

#### `format<a>(Route<a>, ...a):URL`

Given a `Route<a>` and parameters (`...a`) returns an appropriate `URL` instance.

```js
Route.format(
  Route.segment("find").param(Route.String),
  "cats"
) //> {pathname: 'find/cats', search:'', hash:''}

Route.format(
  Route
    .Root
    .segment("blog")
    .param(Route.String)
    .segment("tag")
    .param(Route.String)
    .segment(),
  "cats",
  "breed"
) //> {pathname: '/blog/cats/tag/breed/', search:'', hash:''}
```


#### `(route:Route<a>).format(...a):URL`

For convenience `format` is also exposed as method on route instences: 

```js
Route
  .segment("find")
  .param(Route.String)
  .format("cats") //> {pathname: 'find/cats', search:'', hash:''}

Route
  .Root
  .segment("blog")
  .param(Route.String)
  .format("tag")
  .params(Route.String)
  .segment()
  .format("cats", "breed") //> {pathname: '/blog/cats/tag/breed/', search:'', hash:''}
```

## Install

    npm install route.flow

[node URL]:https://nodejs.org/dist/latest-v8.x/docs/api/url.html#url_class_url
[Location]:https://developer.mozilla.org/en-US/docs/Web/API/Location
[opquae type alias]:https://flow.org/en/docs/types/opaque-types/
[float.flow]:https://www.npmjs.com/package/float.flow
[integer.flow]:https://www.npmjs.com/package/integer.flow
[query parameters]:#query_parameters
[function subtyping]:https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/#function-subtyping
[Express]:https://expressjs.com/
[express routing]:https://expressjs.com/en/guide/routing.html
[Node.js]:https://nodejs.org/en/
[flow]:http://flow.org/
[typescript]:http://typescriptlang.org/

[travis.icon]: https://travis-ci.org/Gozala/route.flow.svg?branch=master
[travis.url]: https://travis-ci.org/Gozala/route.flow

[version.icon]: https://img.shields.io/npm/v/route.flow.svg
[downloads.icon]: https://img.shields.io/npm/dm/route.flow.svg
[package.url]: https://npmjs.org/package/route.flow


[downloads.image]: https://img.shields.io/npm/dm/route.flow.svg
[downloads.url]: https://npmjs.org/package/route.flow

[prettier.icon]:https://img.shields.io/badge/styled_with-prettier-ff69b4.svg
[prettier.url]:https://github.com/prettier/prettier