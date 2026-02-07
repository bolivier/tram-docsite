# Database

ORMs are very complex pieces of software that often create a lot of
complexities.  With that in mind, Tram places a strong emphasis on SQL native
concepts.

That said, working exclusively with SQL can get verbose, tiring, and introduce
trivial mistakes.

To that end, Tram does include an ORM, but it is in no way an escape hatch from
sql, or a way to avoid writing SQL.  You need to know SQL.

## Default Database

Tram uses Postgres by default.  Any database with the appropriate JDBC library
should be compatible, but some features assume Postgres, and this documentation
assumes Postgres.

The starter template includes a dockerfile to let you run postgres locally with
`docker-compose up`.

There is also a script `bin/db-init` that will initialize project databases.

## Toucan 2

The ORM tram uses is called [Toucan 2](https://github.com/camsaul/toucan2).
It's an amazing library, and Tram would not exist without it.  Most of the
required functions are re-exported from the `tram.db` namespace.

## Models

Read more about how models work in [associations](/associations) and
[models](/models).

## Configuration

Database configuration is controlled via the `tram.edn` file.  You have 3
environments, and they all have their own database config, `:db`.

You can configure these to match whatever values you need.  Values from the
environment can be read with the reader macro `#env ENV_VAR`.  The
recommendation for setting those values is a `mise.toml` file.
