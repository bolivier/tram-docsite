# Routing

Tram uses explicit routes and not file-based routing.  This is because a Tram
router uses Clojure data structures under the hood.  They can be manipulated and
read without reading the filesystem.

Every Tram project has a root `routes.clj` file that is the entry point for the
router.  Routers, like other application components, are initialized via
[Integrant](https://github.com/weavejester/integrant).

The `routes.clj` file initializes two system components, `::routes` and
`::router`.  The routes is the simple data structure of routes, and the router
is a reitit http router that provides support for interceptors, coercion, and
fast lookup.

Most of the time you'll only need to modify the routes.  The exception is if you
need to modify the global interceptors.

## Handler

A **handler** is a function that takes a request map and returns a response map.

## Handler Spec

A **handler spec** is a map used in routes that has a `:handler` key.  It can
also have metadata, parameter coercion, or any arbitrary data that will be
stored in the router.

## Handler Entry

A **handler entry** is anything valid to appear in a route map where its key is
an http verb.  eg.  Anything that can go with `:get`, or `:post`.

This means a **handler** is a valid **handler entry**.

```clojure
{:name :route/my-home
 :get homepage-handler}
;; is equivalent to
{:name :route/my-home
 :get  {:handler homepage-handler}}
```

# Routes

## Route Basics

Routes are defined with the macro `tram.routes/defroutes`.  This macro performs
some work to ensure that additional data is added to the route entry to support
other tram features.

A single route is a vector with the shape `["path-string" route-definition]`.

The route definition is either a map with the key `:name` (route names MUST have
the namespace `route` or `route.<something>`) OR another route definition.

The route definition maps verbs to their handler functions via any type of
handler entry.  A route map requires one or more verbs.  These are

```clojure
#{:get :put :patch :post :delete}
```

## Nesting Routes

To nest a route, simply wrap the routes and use an empty path string.

```clojure
["/dashboard"
 ["" {:name :route/dashboard}]
 ["/users/:user-id" {:name :route/users}]]
```

::: tip NOTE
All verbs share the same route name.
:::

## Interceptors

Interceptors apply to all nested routes.

They can be added as a vector on the `:interceptors` key in any routes.

Most of Tram's features are implemented with interceptors, they're a great way
to add functionality.

```clojure
["/dashboard"
 {:interceptors [dashboard-interceptor]}
 ["" {:name :route/dashboard}]
 ["/users/:user-id" {:name :route/users}]]
```

In these routes, `dashboard-interceptor` will run on both routes.
