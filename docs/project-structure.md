# Project Structure

When you create a new Tram application, you'll be greeted with a starter
application.  There's a lot to explore here, so let's quickly explore the
different areas of the starter as an introduction.

The file structure of your project starts something like this.

```
sample-app
├── bin
│   ├── db-init
│   └── test
├── build.clj
├── deps.edn
├── dev
│   ├── migrations.clj
│   ├── runtimes
│   └── user.clj
├── docker-compose.yml
├── e2e
├── mise.toml
├── README.md
├── resources
│   ├── migrations
│   ├── seeds
│   └── tailwindcss
├── src
│   └── sample_app
│       ├── concerns
│       ├── config.clj
│       ├── core.clj
│       ├── db.clj
│       ├── handlers
│       ├── models
│       ├── routes.clj
│       ├── server.clj
│       └── views
├── tasks
│   └── dev
│       ├── server.clj
│       └── tailwind.clj
├── tests.edn
└── tram.edn

```

## Development time code `dev/`

Because you'll interact with the REPL so much, you'll likely want places to put
code that is meant for interaction with the REPL.  That can live in `/dev`. 

`dev/migrations.clj`, for example, is a namespace that you can use to run
migrations without starting a new JVM.

## Build file `build.clj`

This file is a build script for your application.  You can run Tram apps via
`clj` or you can compile them to a `.jar` file and run them as a plain JVM app. 

::: tip
Compile your application with `clj -T:build uber`
:::


## Handlers `src/sample_app/handlers`

Handlers are functions that take a request map and return a response map. 

::: tip Important
Handlers must live in a file like `user_handlers.clj` for automagic in
Tram to work properly.

The domain prefix should be a **singular** noun. 
:::

These functions also export one vector, typically called `routes`, defined with
`tram.routes/defroutes`. These are a segment your application routes. Routes are
embedded in another routes vector up to the root routes collection in
`src/sample_app/routes.clj` where the route data is passed to
`tram.routes/tram-router`.

Typically, you'll interact with keys like these in a request:

```clojure
{:parameters {:path {:user-id 2}
              :body {:name "Fred"}}

 :current-user {:id   3
                :name "Bob"}}
```

There are likely going to be a lot of big maps in the request map because
injection is a key way of passing data around in Tram.

A typical response might look like 

```clojure
{:status 200
 :locals {:user user}}
```

Read more about routes in the [routing guide](routing).

## Views `src/sample_app/views`

Views are typically a 1:1 mapping of handlers.  Via naming conventions you can
read about in the  in the [routing guide](routing), views are
automatically looked up for corresponding handlers.

In Tram, a view is simply a function that receives a single argument, the
`locals` map from a handler, and returns a vector of hiccup (html).

Read more about views in the [views guide](views).

## Models `src/sample_app/models`

Models in Tram are dramatically lighter than in other frameworks.  Their primary
concern is interacting with the database.  These namespaces are not to define
functions that operate on your model, but to add custom behavior and queries to
simplify database interaction.

For example this snippet which will remove the password key from a user model
after being retrieved from the database so you don't accidentally select it.

```clojure
(db/define-after-select :models/users
  [user]
  (dissoc user :password))
```

Read more about model files in the [model-guide](./models).

## Concerns `src/sample_app/concerns`

Concerns are domain areas where most of your logic should live.  These can be
split up in any way that makes sense for your application. 

Read more about concerns in the [concern guide](./concerns).

## Components `src/sample_app/components`

Components are reusable view functions that return hiccup (html).

## Application system `src/sample_app/config.clj`

Tram uses Integrant to connect various stateful parts of your application.
These are defined here in a system configuration map, and they are started in
order based on a dependency graph.  

Until you need to add new system components (something like Redis), you likely
won't need to touch this.

## Application Entry `src/sample_app/core.clj`

Root to your application. This sets up the server, initializes the system
configuration, and  boots up the application.

## Database Configuration `src/sample_app/db.clj`

This is where you'll write any global configuration for your database.

By default, the only thing this file does is set a default connection to your
database based on environment variables.

## Root Routes and Router `src/sample_app/routes.clj`

You'll need to add new routes and interceptors here.

## Http Server `src/sample_app/server.clj`

Starts the http server.

## `bin`

For external binaries your application might need.  Scripts that are external to
Tram.  By default there is a test binary, which runs your tests with Kaocha, and
there is a init-db script to create your databases. 

## `deps.edn`

Root Clojure configuration file.  Think of a package.json or Gemfile.

## e2e

Holds a npm project that can be used to test e2e with Playwright. For now, this
is the recommended approach.  There is some scaffolding there to make it easy to
get started.

## `mise.toml`

Environment, tool, and task configuration.

Read their [official docs](https://mise.jdx.dev/) for more information.

## `resources`

This holds non source code requirements for your application.  These are
included on the classpath by default.

Included are an images directory (not images served on your server); a
migrations dir for sql migrations; a public dir for assets accessible over http;
a seeds dir, for Clojure code that initializes seed data; and a tailwindcss
project for generating index.css from tailwind classes that you use in your
views.

## `test`

Directory for tests.


