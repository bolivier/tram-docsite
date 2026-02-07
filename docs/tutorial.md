# Tram Tutorial

This tutorial should give you all you need to get started writing Tram apps.
It's a little long, but it covers all you need to know.

We'll be implementing a small poll application, inspired by the [Django
tutorial](https://docs.djangoproject.com/en/6.0/intro/tutorial01/).

You can see a list of polls, and select one, and vote on them.

 ## Create a new project


 First step is to create a new Tram project.  At your terminal type the following:

```shell
tram new polls
```

That will scaffold a new Tram application.  It will be in the directory
`polls` and should look something like this

```
├── bin
├── build.clj
├── deps.edn
├── dev
│   ├── migrations.clj
│   ├── runtimes
│   │   ├── generate_sessions.clj
│   │   └── generate_users.clj
│   └── user.clj
├── docker-compose.yml
├── mise.toml
├── README.md
├── resources
│   ├── migrations
│   └── tailwindcss
├── src
│   └── polls
│       ├── concerns
│       ├── config.clj
│       ├── core.clj
│       ├── db.clj
│       ├── handlers
│       ├── http
│       ├── models
│       ├── routes.clj
│       ├── server.clj
│       └── views
├── tasks
├── test
├── tests.edn
└── tram.edn
```
Let's briefly cover each element one by one.

- `bin` is a directory for scripts you might want to run.  There should be a
  `test` script in there
- `build.clj` is the build program for this project.  It produces a .jar file.
- `dev` is  a directory for non-application development-time code.  This might
be unclear if you come from a background where you don't interact with the
runtime much.  In Clojure, you evaluate a lot of ad-hoc code.  For example, you
can run database migrations from `dev/migrations.clj` and you can start the
development server from `dev/user.clj`
- `docker-compose.yml` is the config to start a docker container for the
  database.
- `mise.toml` sets versions of any programs you need (postgres)
- `resources` are non code application files, you can see that migrations and
  tailwind is there.
- `src` is where your application code lives
- `tasks` are tram tasks, which can be run with `tram run <taskname>`.  They are
  Clojure files.
- `test` is a directory that mirrors the structure of `src` and contains test
  files
- `tests.edn` is a config file for the kaocha test runner
- `tram.edn` is the tram configuration file

In your source code, there are some root files you won't need to touch often,
and there are 4 directories that are most of what you'll write: `concerns`,
`handlers`, `models`, and `views`.

- `handlers` are http endpoints.
- `concerns` are business logic
- `views` are hiccup/html components
- `models` is for code that you need to use to interface with the database

::: tip Note
Models in Tram are not like typical ORM models.  You do not write methods on
them.  The code in `models` is specifically for interactions at the database
boundaries.

Think adding db associations, or defining pre-insert or post-select transforms.
:::

## The REPL

The way you interact with a Clojure app is atypical compared to other languages.
Typically, you start a server, edit code, maybe there's a compile step, maybe it
hot-reloads, maybe the server restarts, and you check the behavior.

Instead, Clojure emphasizes REPL driven devlopment (read-eval-print-loop). You
start the language runtime, connect your editor to the runtime, and 
 build your application by evaluating forms.

## Pre Development Setup Steps

When creating a new appliation, there are some setup steps. First you need to
start the Postgresql docker container and initialize the databases. These are
done with the following commands.

```sh
docker-compose up -d
# when that's done
bin/db-init
```

It should output something like

```
Creating databases 'polls_development' and 'polls_test'...
... more stuff
✅ Done.
```

You'll need to have environment variables `PG_USER` and `PG_PASSWORD` available.
The default password for the development database is `tram` and the username
should be your username.

## UI setup

This isn't a tutorial for design or CSS. Cd into `resources/tailwindcss` and
install [daisyui](https://daisyui.com/?lang=en).

```sh
npm i -D daisyui
```

and update `index.css` with 

```css
@import "tailwindcss" source("../../src");
@config "./tailwind.config.js";
@plugin "daisyui"; [!code ++]
```

## Running the app

Start the app with `tram dev`.  You should see output from tailwindcss first,
then output from the Clojure process starting up.

```sh
tram dev
```

After you start the runtime, you need to connect your editor.

### VSCode

Clojure uses the Calva plugin. Open the command palatte and select "Calva:
Connect to a running server". Select a deps.edn project, and it should find the
port for you.

You'll know it's working correctly when it opens a tab that has what looks like
a node shell in it and you can evaluate Clojure code like `(+ 2 2)` and get 4.

Open the command palatte again and select "Load/Evaluate current file".  Then
move your cursor after `(go)` (it is inside a comment block).  Press
ctrl+return to evaluate the preceeding form.

The server should be running now.  Visit `localhost:1337/sign-in` to verify that
you see a sign in screen.

::: warning
From here on, I'll write things like "evaluate the expression" and that means to
place your cursor after it, and run the evaluate command.

Sometimes you may need to evaluate the whole file, or a part of the file, or a
some specific code.

I have a shortcut that runs this code to reset all the code in the application
to the most up to date version

```clojure
(ns user)
(require '[integrant.repl :as ir])
(ir/reset)
```
:::

## First Route

We will need a few pages

- a page to view a list of polls
- a page to view/vote on a single poll
- a page to show the poll results

Tram uses Clojure's builtin data structures to define routes.

### Your first routes

Create a new file at `src/polls/handlers/poll_handlers.clj`

::: info
Clojure namespaces are kebab-case, but because of the JVM, the files need
to be snake_case.
:::

This file should look like

```clojure
(ns polls.handlers.poll-handlers
  (:require [tram.routes :as tr]))

(defn polls-index [req]
  {:status 200
   :body   "Hello, world. You're at the polls index."})

(tr/defroutes routes
  ["/"
   {:name :route/polls-index
    :get  polls-index}])
```

Let's break this down real quick.

```clojure
(ns polls.handlers.poll-handlers
  (:require [tram.routes :as tr]))
```

This creates our namespace, and requires the namespace `tram.routes` as a
dependency and aliases the full namespace to the shorter name `tr`.

```clojure
(defn polls-index [req]
  {:status 200
   :body   "Hello, world. You're at the polls index."})
```

This defines our first handler. Handlers are functions that take an http request
and return an http response; both requests and responses are modeled as Clojure
maps. You can see that this handler's response has a status of 200, and a body
with a hello world string.

```clojure
(tr/defroutes routes
  ["/"
   {:name :route/polls-index
    :get  polls-index}])
```

This creates the routes vector. There is only one route, the root, and it has
the name `:route/homepage`, and a `GET` request issued to this route will use
the `polls-index` handler. `tr/defroutes` is a macro from `tram.routes` that
adds additional data to the routes to enable some magic later.

 If you run your application now, the routes will 404. That's because these
 routes are not mounted anywhere. The `routes` vector needs to be added to our
 root routes so that it can be accessed by the system. This is done in
 `src/polls/routes.clj`

`routes.clj` defines all your application's routes. The routes themselves are
stored in a vector, which is passed to a router object. The router has
additional behavior like interceptors and data coercion, which we'll talk bout
later.

For now, update the existing application routes to use the new polls routes.

```clojure
  (:require [integrant.core :as ig] 
            ...
            [polls.handlers.poll-handlers :as poll.handlers];;[!code focus] [!code ++]
            ...
```

```clojure
(defmethod ig/init-key ::sys/routes
  [_ _]
  [""
   ["/assets/*" {:get (ring/create-resource-handler)}]
   ["/healthcheck"
    {:name    :route/healthcheck
     :handler (constantly {:status 200
                           :body   "Alive."})}]
   auth.handlers/routes
   poll.handlers/routes]) ;; [!code ++]
   ["/dashboard";; [!code --]
    {:name :route/dashboard;; [!code --]
     :get  {:handler (fn [_];; [!code --]
                       {:status 200;; [!code --]
                        :template;; [!code --]
                        #'polls.views.authentication-views/dashboard})}}]]);; [!code --]
```

Restart the app (from the repl) and you should now see the following message on
the home page.

```
Hello, world. You're at the polls index.
```

::: tip
Restart your application by evaluating this code from `user.clj`

`(ir/reset)`
:::

## A Migration

We need to create database models so we can show our list of polls on the index
page.

Our data model will have polls and choices. 

![database schema](./public/polls-and-choices.svg)


To create a migration, run the following from the CLI

```sh
tram generate migration 'create-polls-and-choices'
```

You might be tempted to head straight to `/resources/migrations` and start
editing the SQL file there, but Tram has a little shortcut.

Tram supports **developer runtimes**.  These are transient files, not checked
into version control, that let you create the skeleton for your SQL files faster
than writing them by hand.  They do not replace sql, and they do not do anything
other than generate the SQL file.  SQL is primary, and this is just a helper,
you can easily write all the SQL to generate tables from scratch.

Visit `/dev/runtimes/create_polls_and_choices.clj`, that is the developer
runtime you just created.

It's an abbreviated definition of the migration.  It generates the files from
the timestamp, the name, and the contents are controlled via actions.

Remove the actions, and replace them with this vector

```clojure
[{:type       :create-table
  :table      "polls"
  :timestamps true
  :attributes [{:name :text
                :type :text}]}
 {:type       :create-table
  :table      "choices"
  :timestamps true
  :attributes [{:name :text
                :type :text}
               {:name    :votes
                :type    :integer
                :default 0}
               {:name :poll-id
                :type :reference}]}]
```

This creates 2 primary SQL statements, both of which create new tables.  These
tables are called `polls` and `choices`.  They automatically include a primary
key which is a serial integer, and they are configured to have `created_at` and
`updated_at` timestamps (`updated_at` will be updated and managed by an
automatically generated update trigger that is also added to the file when you
request timestamps).

Evaluate this whole file, then evaluate the expression at the bottom,
`write-to-migration-files`.

You can visit the SQL files that were generated and verify that they are
correct.  You can also modify the SQL migrations directly (although the runtime
will overwrite them if you run `write-to-migration-files` again).  SQL is the
primary way to control your database behavior.  It's all your database
understands.

Before you can run the migrations, you need to run the `init.sql` file that sets
up Postgres extensions and initializes some content.

Evaluate `(db/init-migrations)` in the `migrations.clj` file to initialize your
sql migrations.

After that, run the new migration either from `migrations.clj` with
`tram.db/migrate` or from the CLI with `tram db:migrate`.

Now you should be able to use the new models.

## Models

Models in Tram are handled via the fantastic Toucan 2 library.

They are read straight from the database tables, and do not require definition
files.

Let's jump over to the poll handlers file and display our models on the index
page.

First, it's hard to work with something intangible, so we should create a few
models and work with those so we can know if our UI is working.

Write this comment block at the bottom of your handlers file and evaluate after
the `do` block.

```clojure
(comment
  (do
    (require '[tram.db :as db])
    (db/insert! :models/polls {:text "What is your Quest?"})
    (db/insert! :models/polls {:text "What is your favorite color?"})
    (db/insert! :models/polls {:text "What is the airspeed velocity of an unladen swallow?"})
    (def polls (db/select :models/polls))
    (let [{:keys [id]} (db/select-one :models/polls
                                      :text
                                      "What is your favorite color?")]
      (doseq [text ["red" "green" "blue"]]
        (db/insert! :models/choices
                    {:poll-id id
                     :text    text}))))
  nil)
```

Now you have 3 polls stored in the database, and they are stored in a var
`polls`, which you can access in your handler.

## Templates

Require the `tram.db` namespace in your handlers file and replace `:body` with
hiccup that iterates over the polls

```clojure
(defn polls-index [req]
  {:status 200
   :body   "Hello, world. You're at the polls index." ;; [!code --]
   :body [:ul ;; [!code ++]
          (for [poll (db/select :models/polls)] ;; [!code ++]
            [:li [:a {:href "#"} (:text poll)]])]}) ;; [!code ++]
```

The text for the polls should be visible on the index page now.

This isn't very good though. We don't want to mix up our view and handler
concerns like this. We can move the hiccup to a view file and have it in a
**template**. 

::: tip Definition 
A **template** is a function that takes a map of `locals` and returns hiccup
representing html
:::

Create `/src/polls/views/poll_views.clj` and add a `polls-index` function to
correspond to the handler (it is vital to use the _same function name_.)

```clojure
;; /src/polls/views/poll_views.clj
(defn polls-index [locals]
  [:ul
   (for [poll (:polls locals)]
     [:li
      [:a {:href "#"} (:text poll)]])])
```

To pass the locals, simply add them to the response map. Replace the `:body` key
with `:locals`. Tram automatically resolves the template if the names are the
same. If you can't, or don't want to, use the same name, you can specify the
template with the key `:template`.

```clojure
(defn polls-index [req]
  (let [polls (db/select :models/polls)]
    {:status 200
     :locals {:polls polls}}))
```

Continued in [Part 2](/tutorial-part-2).
