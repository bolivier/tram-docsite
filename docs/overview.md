# Overview

Tram is a Clojure web application framework.  Tram takes advantage of the unique
abilities provided by Clojure to make you more productive when creating apps for
the web.

Tram was initially created because getting started building Clojure web
applications can easily overwhelm even an experienced Clojure developer.
Typically, the community advises you to evaluate all the available libraries for
a problem before choosing one.  But sometimes you have to get work done.
You don't always want to evaluate different http servers when they all basically
work.  You just need something to get started that you can swap out later if
necessray.  Tram gives you a collection of libraries collected into our
compressed namespaces so you don't have to worry about that when you want to
start a project.

Tram provides a set of defaults, but nothing in Tram is required.  Opt out of
anything you don't want to use and replace it with your preferred tool.  Don't
like our http server?  Use a different one.  Prefer a different clientside
solution?  Use it.  Nothing is permanent, but everything was chosen to work
together well.

## Clojure

If you're new to Clojure, we recommend doing some basic problem solving before
starting a Tram application.  There are lots of good options for ways to explore
the ecosystem in a simpler way before trying to build a full application.

[Advent of Code](https://adventofcode.com/) is a set of puzzles really well
suited to getting comfortable with REPL-driven-development.

[X in Y Minutes](https://learnxinyminutes.com/clojure/) has a page to give your
a whirlwind tour of the language.

[Clojure for the Brave and True
](https://www.braveclojure.com/clojure-for-the-brave-and-true/) is a fun book
many people have enjoyed learning Clojure from.


## Tram Architecture

Tram should be familiar to developers who have used other MVC frameworks like
Rails, Phoenix, or Laravel; and easy to pick up if you have used Next.js,
Express, or Flask.

### Models

Tram's models use [Toucan2](https://github.com/camsaul/toucan2) as an ORM.  It's
more lightweight and SQL forward than most ORMs.

One key distinction is that models are read straight from your database, so
there is no model file to keep in sync.

Our models support:

- declarative querying
- querying, updating, and saving without writing SQL
- extensible hydration for nested data

### Handlers

Handlers are how Tram models an http endpoint.  Handlers are functions that
accept a single parameter, a map representing the http request, and they return
a map representing the http response.

### Views/Templates

Tram uses hiccup (via [huff](https://github.com/escherize/huff)) to represent
html in a compact syntax.

```html
<div class="container" id="submit-button-container">
  <button class="btn p-4">
    Submit
  </button>
</div>
```

becomes

```clojure
[:div#submit-button-container.container
 [:button.btn.p-4
  "Submit"]]
```

### Concerns

Tram recommends grouping your business logic in "concerns".  A concern can be
anything from a domain (like "authentication") or a model (like "user").

These are simply namespace containers to group related behaviors.

### Interceptors

Tram uses Interceptors in place of middleware.  Interceptors make defining
behavior _after_ your request is complete a little easier.

Interceptors are Clojure maps with a `:name`, `:enter` fn run before the
request, and a `:leave` fn run after the request.  They accept and return a
**context map** which flows through all the `:enter` functions, then your
handler runs, then the context map flows through all the `:leave` functions.

<img style="margin: auto" src="./public/interceptor-stack-queue.svg"/>

## Tools

By default Tram comes ready to use Postgresql in a Docker container for your
database, but any database with a JDBC driver is supported.

By default Tram uses HTMX for swapping html partials.

## JSON api

Tram supports JSON apis out of the box.  Simply use the correct headers to
request JSON, and return a clojure map in the `:body` of your response.
