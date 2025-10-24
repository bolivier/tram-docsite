# Models

Models represent database objects.  Unlike other ORMs, you don't define
 an application level representation of the database model.  Models
are read straight from the database.

For validation and parsing, you can write a Malli schema.

Database access in Tram is handled through Toucan2, an excellent light ORM library
for Clojure. [Read more about Toucan2](https://github.com/camsaul/toucan2).

::: info
Tram re-exports the functions from `toucan2.core` from `tram.db` to avoid
extra deps in `deps.edn`.  If you need something not exported from that ns, add
Toucan2 to your dependencies and import it from there.
:::

Models are maps, they do not have methods.

The model namespace is solely for functions and configuration related to the
database itself. Do **not** put domain logic in model files.

## Naming Conventions

Models are identified via namespaced keywords like `:models/users`.  The model
name "users" should have the database name "users".


| Model keyword     | Database Table | DB Foreign-key | Clj Foreign-key |
|-------------------|:--------------:|---------------:|-----------------|
| `:models/users`   | `users`        |      `user_id` | `:user-id`      |
| `:models/people`  | `people`       |    `person_id` | `:person-id`    |
| `:models/indices` | `indices`      |     `index_id` | `:index-id`     |


## Database Queries

Database queries are functions from `tram.db`, and they take the model keyword
as the first param.

These examples will all use `:models/users` as the model.

### Select

To select a user by primary key `(db/select-one :models/users 2)`

To select a user by another attribute `(db/select-one :models/users :email
"who@example.com")`

To select a user by a more complicated query, you use Honeysql

```clojure
(db/select :models/users (-> (select [:email :first-name])
                             (where [:< :age 25]
                                    [:= :fitness 10])))
 ```

 ### Insert
 
 Insert uses a similar syntax to `select`.  The first param is your model
 keyword, and then your model data.
 
 ```clojure
 (db/insert-returning-instance! :models/users
                                {:name "Brandon"
                                 :age 32
                                 :email "brandon@tram.codes"})
```

There are options for what return value you want. 

### Update
### Delete
### Validations
### Associations

Tram supports `has-many!` and `belongs-to!` associations that can be hydrated on
your model with `db/hydrate`.  

Read more in [Associations](/associations)

## Transforms

Sometimes you'll want to transform a model before inserting, or after selecting.
You can do this with `tram.db/deftransform`

An example, you have user, superuser, and admin types of users stored as TEXT on
the `type` column. It's more idiomatic in Clojure for that to be a keyword than
a string. 

You can define a transform for your user object that modifies it before
inserting into the database, and after selecting from it like this 

```clojure
(db/deftransforms :models/users
  {:type {:in  name
          :out keyword}})
```





## JSONB columns

JSONB columns need to be explicitly serialized to a PGObject before being saved.
That can be done in the models with this code.

```clojure
(toucan2.core/deftransforms :models/user
    {:metadata {:in tram.db/clj->jsonb}})
```

There is no need to handle the `:out` case. That works out of the box. This is
because of how these values are sent to honeysql. I would like to remove the
requirement to do this in the future.
