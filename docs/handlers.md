# Handlers

Request handlers receive a map representing an http request, and return a map
representing an http response. This is the [Ring
protocol](https://github.com/ring-clojure/ring),
which is common in Clojure apps.

Tram offers several enhancements to the basic functionality.

## implicit `:template`

If the response map does not include a `:template` key, one will be inferred.

This inference goes to the corresponding views namespace and looks for a
function that has an identical name to the handler fn.

For example,

`myapp.handlers.dashboard-handlers/get-user` would correspond to
`myapp.views.dashboard-views/get-user`.  Without an explicit template, this is
the expected function, and if it does not exist, the response will error.

## explicit `:template`

Sometimes you want to explicitly say which template you want to use.

The value for `:template` is either the fn you want to use, or you can use
`:views/fn-name` to lookup `fn-name` in the corresponding views ns, similar to
how the implicit template values work.


## `:locals`

`:locals` is a map in the response map that is passed to the template fn as a
single parameter.  There is no implicit handling for this.  The map is empty if
it is omitted.

## `:body`

If your response map includes `:body`, the template system is bypassed.  `:body`
will be converted from hiccup to html as the templates are.

## Parameters

Handlers that receive a body can have the body parsed into the right format, and
have arbitrary schemas validated against it.

Without any coercion, parameters are in `:body-params` in the request map.

With coercion, they are in `:parameters`, either `:query`, `:body`, or `:path`.

It is *highly* recommended that you parse and validate all incoming parameters
and only read from `:parameters`.

For a create user endpoint, this might look like

``` clojure
["/users"
 {:name :route/users,
  :post
    {:handler create-user,
     :parameters {:body [:map
                         [:name :string]
                         [:age [:maybe :int]]
                         [:email [:re "[a-z]+@\..**"]]]}}}]
```

This will validate that a user has a `:name`, maybe has an `:age` which must be
an integer, and has an `:email` which is an email shaped string.
