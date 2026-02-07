# Tutorial Part 2

Now that we have an index view, lets add the other views we need.

We'll add them at once with placeholders, and then update the placeholders as we
go.  I find that Clojure is good at helping you get the structure you want, then
refining that structure via the repl.

To start, let's update our polls routes with routes to view a poll, and a
route to view the results of a poll.

```clojure
(tr/defroutes routes
  [""
   ["/"
    {:name :route/homepage
     :get  polls-index}]
   ["/poll"
    ["/:poll-id"
     {:parameters {:path [:map [:poll-id :int]]}}
     [""
      {:name :route/poll-details
       :get  poll-details-page}]
     ["/results"
      {:name :route/poll-results
       :get  results-page}]]]])
```

Something new here is that `:parameters` key. Tram encourages you not to mix
validation and preparation of a handler with the handler code itself. That key
enables request validation. This ensures that it has a path
parameter called `:poll-id`, that is an integer, and it'll parse that into an
integer. `:poll-id` is available to all descendent routes. You can access it in
the request at `[:parameters :path :poll-id]`.

Add these 2 handler functions with some placeholder content.

```clojure
(defn poll-details-page [req]
  {:status 200
   :body   (format "You're looking at poll %s"
                   (get-in req [:parameters :path :poll-id]))})

(defn results-page [req]
  {:status 200
   :body   (format "You're looking at the results for poll %s"
                   (get-in req [:parameters :path :poll-id]))})
```

These routes are now available in your application.  They currently don't check
that you're looking at a real poll or not, so you can use any integer in the
path.

## Redirect on missing poll

 To redirect when a user tries to visit a URL for an invalid poll, we are
going to use an **interceptor**.

::: tip Definition

**Interceptors** are how Tram adds behavior to routes.

They are Clojure maps that have a `:name`, and optionally `:enter` and `:leave`
functions that take a context map (with `:request` and `:response`) and return a
modified context.

For example

 ```clojure
 (def logging-interceptor
   {:name ::logging-interceptor
    :enter (fn [ctx]
             (log/event! ::saw-request {:data (:request ctx)})
             ctx)})
```

:::

Add a new route, poll-not-found, and add the interceptor to the routes under the
path param.

```clojure
(tr/defroutes routes
  [""
   ["/"
    {:name :route/homepage
     :get  polls-index}]
   ["/polls/not-found"
    {:name :route/poll-not-found
     :get  :view/poll-not-found-page}]
   ["/poll"
    ["/:poll-id"
     {:interceptors [get-poll-interceptor]
      :parameters   {:path [:map [:poll-id :int]]}}
     [""
      {:name :route/poll-details
       :get  poll-details-page}]
     ["/results"
      {:name :route/poll-results
       :get  results-page}]]]])
```
Notice that the not found page uses a keyword and not a handler function, or
view function.  A keyword like `:view/<template>` can be used in place of a
full handler when all you do in a handler is return a 200.  Tram will look it up
in the corresponding views ns.

Create that view like this

```clojure
(defn poll-not-found-page [_]
  [:span "Could not find poll"])
```

Next we have to implement `get-poll-interceptor`. It will read the poll from the
database, and redirect to the not found page if it does not exist.

```clojure
(def get-poll-interceptor
  {:name  ::get-poll-interceptor
   :enter (fn [ctx]
            (let [poll-id (get-in ctx [:request :parameters :path :poll-id])]
              (if-let [poll (db/select-one :models/polls :id poll-id)]
                (assoc-in ctx [:request :poll] poll)
                (tr/early-response ctx
                                   (tr/full-redirect
                                     :route/poll-not-found)))))})
```

`get-poll-interceptor` uses `tr/early-response` to abandon the queue of
interceptors after this one and early return.

::: info
You want to use `tr/full-redirect` and not `tr/redirect` because it uses a 301
redirect, and not an htmx redirect.  The latter won't work when you are doing an
initial page load.
:::

Now if you try to access a page for a nonexistent poll, it will redirect you to
a not found page.

## Casting votes

To cast votes, we want to present the choices available, allow the user to
select one, record their vote, then redirect to a results page.

First we need to template the poll page. We once again use hiccup and create a
simple form.

```clojure
(defn poll-details-page [{:keys [poll]
                          :as   locals}]
  [:<>
   [:form.max-w-lg {:hx-post (tr/make-route
                              :route/vote
                              {:poll-id (:id poll)})}
    [:fieldset
     [:legend
      [:h1.text-lg.font-medium.mb-2
       (:text poll)]]
     [:div#errors]
     [:div.flex.flex-col.gap-2
      (for [choice (:choices poll)
            :let   [{:keys [id text]} choice]]
        [:label.flex.gap-1.items-center
         [:input.radio {:type  :radio
                        :name  :choice
                        :value id}]
         text])]]
    [:button.btn.btn-primary.mt-2 "Vote"]]])
```

This template accepts the poll, which has choices, iterates over the choices as
radio buttons, and will post that form to the route for casting votes.

Something to notice is the empty `[:div#errors]`.  That is where we'll inject
errors with htmx's out-of-band swaps if something goes wrong.

We need to update our hander so that the poll has choices in it.  You could do
this by simply selecting the choices where that poll id is the same and manually
adding it, but Tram has an easier way.  We can define a relationship between the
tables in our model file, and use **hydration** to automatically inject the
choices.

::: info Definition
**Hydration** is adding one database model to another.  The relationship is
configured in your model files, and then you can call `db/hydration` with the
right values and they will be filled in.
:::

Let's update our model file to define the association between polls and choices.

```clojure
(db/has-many! :models/polls :choices)
```

This one line is all you need to use hydration.  With that in place, if you call
`(db/hydrate poll :choices)`, the choices will be filled in.  Read more about
associations [here](/associations).

Update the handler to pass the correct locals to the template (remember we
already guarantee that this poll exists and is loaded into the request with our
interceptor from earlier).

```clojure
(defn polls-detail-page [req]
  {:status 200
   :locals {:poll (db/hydrate (:poll req) :choices)}})
```

Now we need to create the vote route so that we can save the vote.

Add this route under the `:poll-id` path

```clojure
["/vote"
      {:name :route/vote
       :post {:handler    cast-vote
              :parameters {:body [:map [:choice :int]]}}}]
```

Notice that we added `:parameters` under the verb key. If there were other
routes here, they would not have the same parameter requirements, so we don't
want to share those.

Then add this handler

```clojure
(defn cast-vote [{:keys [poll]
                  :as   req}]
  (let [selected-choice (get-in req [:parameters :body :choice])]
    (if (some? (poll/cast-vote! poll
                                selected-choice))
      (tr/redirect :route/poll-results
                   {:poll-id (:id poll)})
      {:status  500
       :headers {"hx-reswap" "none"}
       :body    [:ul {:id "errors"
                      :hx-swap-oob "true"}
                 [:li "Invalid choice"]]})))
```

Let's break this down.

```clojure
(let [selected-choice (get-in req [:parameters :body :choice])]
```

First we grab `:choice` from the request body (remember, `:parameters`)
guarantees that it is present and has the right shape.

```clojure
(if (some? (poll/cast-vote! poll
                            selected-choice))
```

Then we will use a (not yet written) function from our poll concern namespace to
cast the vote. Functions that modify things or have side effects often end in
`!` to signal that. If we return a value, then the write was successful. If `nil` comes back, we did not successfully
cast the vote, and we need to handle that case.

```clojure
(tr/redirect :route/poll-results
                   {:poll-id (:id poll)})
```

In the truthy expression, we redirect to the results page for the poll.

```clojure
{:status  500
 :headers {"hx-reswap" "none"}
 :body    [:ul {:id "errors"
                :hx-swap-oob "true"}
           [:li "Invalid choice"]]})))
```

In the false expression, we don't redirect, and instead send an oob fragment
with some error content.  You could use a template here, but this is simple
enough to inline.  The header tells htmx not to swap out the main content of the
form.

The final step is to write `cast-vote!`.  Create `/src/polls/concerns/poll.clj`
with this content

```clojure
(ns polls.concerns.poll
  (:require [tram.db :as db]))

(defn cast-vote! [poll choice-id]
  (let [choice
        (db/select-one :models/choices :id choice-id :poll-id (:id poll))]
    (when choice
      (db/save! (update choice
                        :votes
                        inc)))))
```

You can now cast a vote in a poll. But you can't view the results yet.

## Results Page

This is very much the same as our previous task.  We create a template

```clojure
(defn results-page [{:keys [poll]
                     :as   locals}]
  [:main
   [:h1 (:text poll)]
   [:table.table.max-w-md
    [:thead [:th "Choice"] [:th "Vote count"]]
    (for [choice (:choices poll)
          :let   [{:keys [text votes]} choice]]
      [:tr [:td text] [:td votes]])]
   [:a.mt-4.btn.btn-primary {:href (tr/make-route :route/poll-details
                                                  {:poll-id (:id poll)})}
    "Vote again?"]])
```

We update the handler

```clojure
(defn results-page [req]
  (let [{:keys [poll]} req]
    {:status 200
     :locals {:poll (db/hydrate poll :choices)}}))
```

And we're done! You can see the results, and jump back to the poll to vote
again.

## Some Styling

Right now, these pages have similar behavior, but they don't look like a
cohesive app.  Let's add some styling to make the app feel more real.

Up first, we'll add a navbar to the top of all our pages.  Tram supports a
`:layout` key in your router that you can use to add layouts to all descendent
routes.

Update the routes to use a layout.

```clojure
 (tr/defroutes routes
   [""
    {:layout :views/polls-layout} ;; [!code ++]
    ["/"
     {:name :route/homepage
      :get  polls-index}]
    ["/polls/not-found"
     {:name :route/poll-not-found
      :get  :view/poll-not-found-page}]
    ["/poll"
     ["/:poll-id"
      {:interceptors [get-poll-interceptor]
       :parameters   {:path [:map [:poll-id :int]]}}
      [""
       {:name :route/poll-details
        :get  poll-details-page}]
      ["/vote"
       {:name :route/vote
        :post {:handler    cast-vote
               :parameters {:body [:map [:choice :int]]}}}]
      ["/results"
       {:name :route/poll-results
        :get  results-page}]]]])
```

This will wrap all the content with the function
`polls.views.poll_views/polls-layout`.

Layout functions take one parameter, it is a list of the descendent elements.

`polls-layout` will have a navbar, and some padding on a main element of the
page.

```clojure
(defn polls-layout [children]
  [:<>
   [:div {:class "navbar bg-base-200 shadow-sm"}
    [:a {:class "btn btn-ghost text-xl"
         :href  :route/homepage}
     "Polls App"]]
   [:main.max-w-lg.pl-4.pt-4 children]])
```

The pages have a more consistent and useful layout now.

That's the end of the tutorial for the basic features of Tram.
