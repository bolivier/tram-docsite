# Overview

Tram is a web application framework designed to help developers who are new to
Clojure start building web applications without being overwhelmed.

## Clojure

Typical Clojure advice is to evaluate the collection of available libraries and
choose whatever suits you. It's good advice, but somebody new to Clojure will
likely have a hard time doing that.

Tram is a different approach. Tram is an opinionated collection of libraries and
glue code to make it easy to get started.  They are all optional (but encouraged).

If you're completely new to Clojure, you should probably do a few tutorials
elsewhere and then come back here.

If you're feeling motivated, there is a small Clojure tutorial here.

## MVC

Tram should be familiar to developers who have used Rails, Phoenix, Next.js, or
other frameworks.

Tram uses

- Postgres
- htmx
- automatically connected views and handlers
- data defined routes
- interceptors
- hiccup templates

Tram is compatible with anything on the web. You can build a JSON api with any
frontend technology you like.

You can swap out the database for SQLite or MySQL or Datomic. 

You can render your html with something entirely different.  

The default tools will work well together out of the box, but anything is open
to modification.
