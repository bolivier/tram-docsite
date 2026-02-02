# Views

Views are functions that return vectors. Those vectors are rendered as html
before the response is sent.

## `:locals`

Views rarely exist on their own without any values bound. To support usage, Tram
requires a view to take a single argument, `locals`. locals is a map of values
that you set from your handler fn. The value is set with the key `:locals` in
the response.

Dynamic variables `*req*` `*res*` and `*current-user*` are also available in all
view functions.

## Components

View functions support a kind of componentization similar to React.  They are
NOT dynamic on the client, these are the equivalent of server only react
components.  It does not provide dynamism, but it does provide a mechanism to
split UI elements that should feel familiar.

## Dynamic behavior

For dynamic behavior, the recommended approach is to use htmx with endpoints
that return the new html you need.  When that is insufficient, you are free to
use any clientside library you like.

I like using hyperscript, and I've heard positive things about [Alpine.js](https://alpinejs.dev/) and
[Datastar](https://data-star.dev/).  There is nothing in Tram to prevent you
from using those things.  You can require them from a CDN in the definition
of your full html page, and they'll work independently.
