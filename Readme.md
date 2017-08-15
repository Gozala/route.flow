# url-parser.flow
[![travis][travis.icon]][travis.url]
[![package][version.icon] ![downloads][downloads.icon]][package.url]
[![styled with prettier][prettier.icon]][prettier.url]



Library provides low-level API for type safe routing, addressing two primary concerns:

1. Parsing

   Type safe parseing of URLs - Extracting (typed) parameters so that type checker (in this instance [Flow][]) is able to report any missuse.

2. Linking

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

#### Parsing

There are multiple issues with this approach in which can lead to mistakes that can sneak into production:

- Handling of parameters in routes is too repetitive.

   Declaring a parameter requires one to choose an identifier, which you must later repeat to get it from `request.params`. Mistyping the name of the parameter is a mistake which is not caught by the type checker (even if it's used). It's just too easy to make changes that updates names in some places and not other causing program to misbehave.

- Request handler needs to parse route parameters.

   All parameter values are just strings, which means user still needs to parse them and handle all possible
   errors (In our example `/calculator/313/+/bob` would respond with `NaN` :)

#### Linking

Even if we manage to keep parameter nameing in sync across the code base and excell at parsing their values, there still more that could go wrong:

- Route changes affect hyper links.

  Let's say we had to switch to prefix notation for our calculator and switched from URLs like `/calculator/313/+/3` to `/calculator/plus/313/3` it's just too easy to forget to update a link in our `/` route.

## Solution

> **Note:** Example below is more verbose than one above, but that is because it is meant to illustrate this low-level library that is more of a building block for something more higher level and complete like [Express][]. It is also worth noting that API of this library isn't a good fit for the [Express][] API.


```js
import * as URLParser from "url-parser.flow"
import * as URL from "url"
import express from "express"

const index = URLParser.Root
const calculator = index
  .segment("calculator")
  .param(URLParser.Float)
  .segment("+")
  .param(URLParser.Float)

const getIndex = response =>
  response.send(`<a href='${plusRoute.format(313, 3)}'>Calculate 313 + 3</a>`)

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


Presented solution attempts to illustrate building blocks from this library for structuring an URL parser that can be used for:

1. Parsing URL/route parameters in a type safe way.

   Type checker ([Flow][]) can ensure that there is no missmatch between extracted parameters and handlers (`getIndex`, `getCalculator`) using them.
   
   > **Note:** In this specific examlpe [Flow][] will not complain if handler is passed less parameters than it expects due to the way it handles [function subtyping][] rules.
   > 
   > That being said this library comes with solution to address that and ensure that extracted number of parameters matches of what handler expects, it's just seemed little too much for this example.

2. Format hyper-links in type safe way.

   Links are formated via call to route itself `calculator.format(313, 3)` allowing type checker to report any missmatch in type or number of parameters passed.

This elliminates all of the problems pointed out with original example:

- No way to mistype parameter names, at least not without type checker reporting that as an error.
- No need to parse route parameters as our routes are typed parsers already.
  > **Note:** URL parser as presented won't match `/calculator/313/+/bob` URL since `bob` is not a `float`).

- Route changes will not break links. They are formatted from the route themself, so if number or order of parameters changes type checker will be at your service to tell you all the places you need to update. So if we update our routing to prefix notation only our route definition will change & all the links will work as expected:
  
  ```js
  const calculator = index
    .segment("calculator")
    .segment("plus")
    .param(URLParser.Float)
    .param(URLParser.Float)
  ```


## Usage

### Import

Rest of the the document & provided code examples assumes that library is installed (with yarn or npm) and imported as follows:

```js
import * as URLParser from "url-parser.flow"
```

### Type Signatures

This section explains how to read some of the common type signatures used across this library.

> **Note:** Feel free to skip to the [next section](#Primitives)this is not necessary to undestanding how this library works. In fact if you're new to the type systems it's recommended to skip as this can be overhelming and discouraging.

#### `Parser<a> / URLParser<a>`

The core concept in this library is a `Parser` which is able to turn URLs like `/blog/42/cat-herding-techniques` into typed data.

Type signature `Parser<a>` is somewhat cryptic, but what it tells you is that this specific parser if succesfull will extract parameters `a`. Note that `a` is always going to be some kind of tuple usually something like `[string]` for parser that extracts string parameter or `[]` if it extracts no parameters. You may also come across more complex signatures when building up more advanced parsers: `Parser<Concat<Concat<[],[integer]>,[string]>>` which is an equivalent of `Parser<[integer, string]>` - parser that exptracts two parameters `integer` and a `string`.


#### `QueryParser<a>`

It is very similar to `Parser<a>` above, with a difference that it is parses query parameters.

> **Note:** Usually you would just pass `QueryParser<a>` to function that returns `Parser<a>` you'll see an examle in [query parameter parsers](#Query_Parameters) section.

#### `ParamParser<[a]>`

This is kind of a hybrid (of `URLParser<[a]>` & `QueryParser<[a]>`) that extracts single parameter `a`. It's hybrid because it can be used to extract either path parameter or query parameter.

#### `URL`

Library exports following `URL` type that is conveniently compatible with [`document.location`][Location] and [`URL` instances in Node.js][Node URL]:

```js
type URL = {
  pathname?:string,
  search?:string,
  hash?:string
}
```



### Parsing

#### `parsePath<a>(Parser<a>, URL):?a`

Parses given `URL` based on `pathname` and `search` properties, completely ignoring the `hash` property. If `URL` is a match returns tuple `a` otherwise returns `null`.

```js
URLParser.parsePath(parser, document.location)
```

#### `(parser:Parser<a>).parsePath(URL):?a`

For convenience `parsePath` is also exposed as method on parser instences:

```js
parser.parsePath(document.location)
```

#### `parseHash<a>(Parser<a>, URL):?a`

Parse given `URL` based on `hash` and `search` properties, completely ignoring the `pathname` property. If `URL` is a match returns tuple `a` otherwise returns `null`.

> **Note** This is mostly for client side web apps that use `hash` based routing.

```js
URLParser.parseHash(parser, document.location)
```

#### `(parser:Parser<a>).parsePath(URL):?a`

For convenience `parseHash` is also exposed as method on parser instences:

```js
parser.parseHash(document.location)
```

### Primitives


#### `String:ParamParser<[string]>`

Parser that parses a segment of the path (or a query parameter) as a tuple with a single `string` type item:

```js
URLParser.String.parsePath({pathname:"/alice/"}) //> ["alice"]
URLParser.String.parsePath({pathname:"/42/"}) //> ["42"]
URLParser.String.parsePath({pathname:"/blog/alice/"}) //> ["alice"]
```

#### `Float:ParamParser<[float]>`

Parser that parses a segment of the path (or a query param) as a tuple with a single `float` type item.

>**Note:**  `float` is a subtype of `number` exposed as an [opquae type alias][] from [float.flow][] library. `Float` parser will not parse segments like `"NaN"` and `"Infinity"`, or in other words it is guaranteed that parsed parameter will be a finite number.

```js
URLParser.Float.parsePath({pathname:"/42/"}) //> [42]
URLParser.Float.parsePath({pathname:"/-42.5/"}) //> [-42.5]
URLParser.Float.parsePath({pathname:"/NaN/"}) //> null
URLParser.Float.parsePath({pathname:"/Infinity/"}) //> null
URLParser.Float.parsePath({pathname:"/Bob/"}) //> null
```
> **Note:** For convinience library also exports `float` type, but as `number` subtype it can be treated as such.


#### `Integer:ParamParser<[integer]>`

Parser that parses a segment of the path (or a query param) as tuple with a single `integer` item.

> **Note**: `integer` is subtype of `number` exposed as an [opquae type alias][] from [integer.flow][] library. `Integer` parser will not parse segments like `"NaN"`, `"Infinity"` or any floating point number, or more simply it is guaranteed that parsed parameter will be an integer number.

```js
URLParser.parsePath(URLParser.Integer, {pathname:"/42/"}) //> [42]
URLParser.parsePath(URLParser.Integer, {pathname:"/-7"}) //> [-7]
URLParser.parsePath(URLParser.Integer, {pathname:"/+8"}) //> [8]
URLParser.parsePath(URLParser.Integer, {pathname:"/42.2/"}) //> null
URLParser.parsePath(URLParser.Integer, {pathname:"/"}) //> null
URLParser.parsePath(URLParser.Integer, {pathname:"/Infinity"}) //> null
URLParser.parsePath(URLParser.Integer, {pathname:"/NaN/"}) //> null
```

> **Note:** For convinience also `integer` type, but as `number` subtype it can be treated as such.


#### `Root:URLParser<[]>`

Parser that only matches the root URL and extracts nothing hence `[]` in the type signature.

```js
URLParser.root.parsePath({pathname:""}) //> []
URLParser.root.parsePath({pathname:"/"}) //> []
URLParser.root.parsePath({pathname:"/foo"}) //> null
URLParser.root.parsePath({pathname:"bar"}) //> null
```

It is also provides foundation for building up more advanced URL parsers. Further examples will illustrate that.


#### `segment(string):Parser<[]>`

Creates a parser that consumes segment of the `URL` if it matches it but extracts nothing hence `[]` in the type signature.

```js
URLParser.segment("blog").parsePath({pathname:"/blog"}) //> []
URLParser.segment("blog").parsePath({pathname:"/blog/"}) //> []
URLParser.segment("blog").parsePath({pathname:"/blog/cat"}) //> null
URLParser.segment("blog").parsePath({pathname:"/glob"}) //> null
URLParser.segment("blog").parsePath({pathname:"/"}) //> null
```


### Combinators

#### `concat <a, b> (Parser<a>, Parser<b>):URLParser<Concat<a, b>>`

Takes two parsers and combines them into one that parses `URL` with multiple segments and returns concatination of results only if both are seccesfull: 

```js
const blogID = URLParser.concat(URLParser.segment("blog"), URLParser.Integer)
blogID.parsePath({pathname:"/blog/35/"}) //> [35]
blogID.parsePath({pathname:"/blog/42/"}) //> [42]
blogID.parsePath({pathname:"/blog/"}) //> null
blogID.parsePath({pathname:"/42/"}) //> null
```
> **Note** Parsers passed can and often is going to be, a concatination as well.

```js
const blogSearch = URLParser.concat(URLParser.segment("blog"), URLParser.segment("search"))
const searchTerm = URLParser.concat(blogSearch, URLParser.String)

searchTerm.parsePath({pathname:"/blog/search/cats/"}) //> ["cats"]
searchTerm.parsePath({pathname:"blog/search/42/"}) //> ["42"]
searchTerm.parsePath({pathname:"/search/cats/"}) //> null
searchTerm.parsePath({pathname:"/blog/cats/"}) //> null
```

#### `(parser:Parser<a>).segment(string):Parser<a>`

For convenience `segment` is also available as a method on parser instences, which returns a new parsers that in addition will also consumes next segment of the `URL` if it matches supplied `string`.
 

```js
URLParser.Root.segment("blog").parsePath({pathname:"/"}) //> null
URLParser.Root.segment("blog").parsePath({pathname:"/blog"}) //> []

URLParser.Float.segment("inc").parsePath({pathname:"/cat/inc"}) //> null
URLParser.Float.segment("inc").parsePath({pathname:"/7/inc"}) //> [8]
```

> **Note:** It is just a shortcut for creating new segment and then concatinating it:
> ```js
> const blog = URLParser.concat(URLParser.Root, URLParser.segment("blog")
> blog.parsePath({pathname:"/"}) //> null
> blog.parsePath({pathname:"/blog"}) //> []
>
> const inc = URLParser.concat(URLParser.Float, URLParser.segment("inc"))
> inc.parsePath({pathname:"/cat/inc"}) //> null
> inc.parsePath({pathname:"/7/inc"}) //> [8]
> ``` 

#### `(p:Parser<a>).param(ParamParser<[b]>):Parser<Concat<a,[b]>>`

For convenience there is a `param` method on parser instences, which returns a new parsers that will in addion also parse next path segment with a supplied parser.

```js
const calculator = URLParser.Root
  .segment("calculator")
  .param(URLParser.Float)
  .segment("+")
  .param(URLParser.Float)

calculator.parsePath({pathname:"/calculator/313/+/3"}) // [313, 3]
calculator.parsePath({pathname:"/calculator/313/+/"}) // null
calculator.parsePath({pathname:"/calculator/13/+/4.2/"}) // [13, 4.2]
```

> **Note:** It is just a shortcut for `concat` function specialized for specific use case - It takes `ParamParser<[a]>` (which is enforced by type checker) and there for creates parser that parses next segment and extracts it as additional item in returned tuple.


#### `paramParser<a>(string => ?a):ParamParser<[a]>`

Takes a function that given a string argument returns either nothing `null|void` in which case parse fails (returns `null`) or a value of type `a` in which case parse succeeds (returns `[a]`).

> **Example:** Create a parser that will match "only CSS files".

```js
const css = URLParser.paramParser((inn:string):?string =>
  inn.endsWith(".css") ? inn : null)

css.parsePath({pathname:"/base.css"}) //> ["base.css"]
css.parsePath({pathname:"/fontawesome-webfont.woff2"}) //> null
css.parsePath({pathname:"/style/base.css"}) //> null
```

> **Note:** As with other parsers you can use existing combinators to put togather something more evolved.

```js
const stylesheet = URLParser.concat(URLParser.segment("style"), css)
stylesheet.parsePath({pathname:"/style/base.css"}) //> ["base.css"]
stylesheet.parsePath({pathname: "/style/font.woff2"}) //> null
```

> **Note:** `paramParser` returns `ParamParser<[a]>` which cane be used to parse query arguments as well which will be coverd in [query parameters section](#Query_Parameters).

### Query Parameters

Library also provides a way to parse a query parameters like `?name=tom&age=42` along with the rest of the URL.



#### `query<b>(string, QueryParser<[a]>):Parser<[a]>`

Since unlike URL path segments querty parameters are named you can't just use parsers like `String`, `Float` instead you need to wrap them & supply a parameter name. This function does exactly that, it turns any `QueryParser<[a]>` into `URLParser<[a]>` that parses query parameter for the given paramater name.

> **Note:** `ParamParser<[a]>` type is compatible with `QueryParser<[a]>` so they could be used as well.

```js
const limit = URLParser.query("limit", URLParser.Integer)
limit.parsePath({search:"?limit=5"}) //> [5]
limit.parsePath({search:"?limit="}) //> null
limit.parsePath({search:"?limit=0"}) //> [0]
limit.parsePath({search:"?foo&bar&limit=2"}) //> [2]
```

> **Note:** Since `query` returns `Parser<[a]>` it can be used with all the other parser combinators. In fact you can mix query and path parsers.

```js
const find = URLParser.concat(URLParser.segment("find"), URLParser.String)
const limitFind = URLParser.concat(find, limit)

limitFind.parsePath({search:"?limit=5"}) //> null
limitFind.parsePath({pathname:"/find",search:"?limit=5"}) //> null
limitFind.parsePath({pathname:"/find/cat",search:"?limit=5"}) //> ["cat", 5]
limitFind.parsePath({
  pathname:"/find/cat",
  search: "?limit=5&sort=ascending"
}) //> ["cat", 5]
```


#### `(p:Parser<a>).query(string, QueryParser<b>):Parser<Concat<a, b>>`

For convenience there is a `query` method on parser instences, which returns a new parsers that in addition will parse query parameter with a given name with a given parser.

```js
const limitSeek = URLParser.
  segment('seek').
  param(URLParser.String).
  query('limit', URLParser.Integer)

limitSeek.parsePath({search:"?limit=5"}) //> null
limitSeek.parsePath({pathname:"/seek",search:"?limit=5"}) //> null
limitSeek.parsePath({pathname:"/seek/cat",search:"?limit=5"}) //> 
```

> **Note:** It is just a shortcut for calling `query` and then `concat`:
> ```js
> URLParser.concat(
>   URLParser.segment('seek').param(URLParser.String),
>   URLParser.query('limit', URLParser.Integer)
> )            
> ```

### Formatting

#### `formatPath<a>(Parser<a>, ...a):string`

Takes a `Parser<a>`, parameters it extracts (`...a`) and formats an appropriate `URL`:

```js
URLParser.format(
  URLParser.segment("find").param(URLParser.String),
  "cats"
) //> '/find/cats'

URLParser.format(
  URLParser
    .segment("blog")
    .param(URLParser.String)
    .segment("tag")
    .param(URLParser.String)
    .segment(),
  "cats",
  "breed"
) //> '/blog/cats/tag/breed/'
```


#### `(parser:Parser<a>).format(...a):string`

For convenience `formatPath` is also exposed as method on parser instences: 

```js
URLParser
  .segment("find")
  .param(URLParser.String)
  .format("cats") //> '/find/cats'

URLParser
  .segment("blog")
  .param(URLParser.String)
  .format("tag")
  .params(URLParser.String)
  .segment()
  .format("cats", "breed") //> '/blog/cats/tag/breed/'
```

## Install

    npm install url-parser.flow

[node URL]:https://nodejs.org/dist/latest-v8.x/docs/api/url.html#url_class_url
[Location]:https://developer.mozilla.org/en-US/docs/Web/API/Location
[opquae type alias]:https://flow.org/en/docs/types/opaque-types/
[float.flow]:https://www.npmjs.com/package/float.flow
[integer.flow]:https://www.npmjs.com/package/integer.flow
[query parameter parsers]:#query_parameter_parsers
[function subtyping]:https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/#function-subtyping
[Express]:https://expressjs.com/
[express routing]:https://expressjs.com/en/guide/routing.html
[Node.js]:https://nodejs.org/en/
[flow]:http://flow.org/
[typescript]:http://typescriptlang.org/

[travis.icon]: https://travis-ci.org/Gozala/url-parser.flow.svg?branch=master
[travis.url]: https://travis-ci.org/Gozala/url-parser.flow

[version.icon]: https://img.shields.io/npm/v/url-parser.flow.svg
[downloads.icon]: https://img.shields.io/npm/dm/url-parser.flow.svg
[package.url]: https://npmjs.org/package/url-parser.flow


[downloads.image]: https://img.shields.io/npm/dm/url-parser.flow.svg
[downloads.url]: https://npmjs.org/package/url-parser.flow

[prettier.icon]:https://img.shields.io/badge/styled_with-prettier-ff69b4.svg
[prettier.url]:https://github.com/prettier/prettier