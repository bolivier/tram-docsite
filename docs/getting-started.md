# Getting Started

After installing Tram, you should have access to the `tram` command in your
terminal.

## Create a new project

Use `tram new my-tram-project` to create a new Tram app.  The CLI will copy the
template into a directory with the name `my-tram-project`.

After you cd into that directory there are a couple setup steps to follow.

## Install npm deps to run tailwind

Tailwind is optional, but default.  If you don't want to use it, delete the dev
task at `tasks/dev/tailwind.clj` and it won't run.

But to use it, you'll need to install the npm deps.

`cd` into `resources/tailwindcss` and run `npm i` to install the required deps.

## Start Postgres

By default, Tram comes with a docker compose file to create a new Postgres
cluster dedicated to your application.

Run the cluster with `docker-compose up -d`.

If you want to use a system postgres, you'll have to create the databases
yourself. The db names will be available in your `tram.edn`.

To avoid conflicts, Tram runs postgres on the non-default port 5433, instead
of 5432.  You should revert that to use a system Postgres.

## Start Tram development server

In your app directory, run `tram dev` to start all the dev tasks.  By default,
this runs an nrepl server, and tailwindcss in a watch mode.

These are not hard coded.  `tram dev` iterates over all the clojure files in
`/tasks/dev/*.clj` executing their `-main` function.

You can add new dev tasks there or update the existing ones if you need other
dev steps.

## Run initial migrations

Tram comes out of the box with tables for users and sessions.  If you want to
use these, run the migrations.

Connect to the REPL from your editor and visit the file `/dev/migrations.clj`.

Evaluate  `(db/migrate)` to run the migrations.  You may need to evaluate `(db/init)`
first.  You can also create migrations here, and rollback migrations you don't
need.

## Start developing

By default, the http server is not started.  Visit `/dev/user.clj` and evaluate
`(go)` to start the application.

After making changes, evaluate `(reset)` in that namespace, and all your edited
namespaces should be updated. 

::: info
Sometimes there is an issue getting edits made in a views namespace to get
picked up by the refresh function.

If you encounter this, add an explicit import of the views ns to the handlers ns
like this (in your :require block) 

`[my-tram-project.views.users-views]`
