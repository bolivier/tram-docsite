# Associations

Associations are how Tram defines relationships between models to make it easy
to get more data without writing SQL. Associations are intentionally not full
featured. Nontrivial use cases are better suited to raw SQL via queries
assembled with HoneySQL.

Associations are used in 2 steps.

1. Defining the associations in model files
2. Hydrating an instance with data

Tram only supports 3 explicit kinds of associations.

- has-one (implicit)
- has-many (call `tram.db/has-many!`)
- belongs-to (call `tram.db/belongs-to!`)

**Hydration** is when a model has additional data assoc'd into it that are
held in other tables.

If a model has a foreign key on it, that model can be hydrated without
configuration.

Hydrating models with a belongs-to or has-many relationship requires
configuration. Define an association with either `tram.db/belongs-to!` or
`tram.db/has-many!` and you can use `tram.db/hydrate` to fetch those data.

::: info
Under the hood, Tram uses Toucan2 for hydration.  You can read more on
their Github.
:::

## Usage

### Belongs To



In these examples, there are 4 relevant tables (all abbreviated to only the
relevant parts).

An `accounts` table representing a paying account
| column | value       |
|--------|-------------|
| id     | primary-key |

A `users` table representing users of an account
| column     | value                       |
|------------|-----------------------------|
| id         | primary-key                 |
| account_id | foreign key to accounts(id) |

A `settings` table for user settings
| column | value       |
|--------|-------------|
| id     | primary-key |

A join table for users and settings
`settings_users`
| column     | value                       |
|------------|-----------------------------|
| id         | primary-key                 |
| setting-id | foreign key to settings(id) |
| user-id    | foreign key to users(id)    |


To enable hydration of settings, create a has-many association for settings on users.

```clj
(tram.associations/has-many! :models/users :models/settings)
```

The join table is called, by
convention, settings_users. Concat the two table names in alphabetical order.

The table can be specified with `:through`, although I don't recommend this.

```clj
(tram.associations/has-many! :models/users :models/settings :through :settings-for-users)
```

The table name should be a kebab-case keyword here.

With that done, you can call hydrate settings. Note that the hydration keywords
are not namespaced.

```clj
(t2/hydrate <user-model-instance> :settings)
```

### Belongs To

Enable hydration of user on account like this

```clj
(tram.associations/belongs-to! :models/accounts :models/users)
```

You can hydrate an account model like this

```clj
(t2/hydrate <account-model-instance> :user)
```


Note this is singular because this is a 1-1 relationship.

### Has One

`has-one` associations are implicit and will work whenever a table has a foreign
key.  In this instance you would write

```clj
(t2/hydrate <settings-model-instance> :user)
```

and you would have the user object
