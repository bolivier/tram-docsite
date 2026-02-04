# Tutorial Part 2

Now that we have an index view, lets add the other views we need.

We'll add them at once with placeholders, and then update the placeholders as we
go.  I find that Clojure is good at helping you get the structure you want, then
refining that structure via the repl.

To start, let's update our polls routes with routes to view a question, and a
route to view the results of a question.

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
      {:name :route/question-details
       :get  poll-details}]
     ["/results"
      {:name :route/poll-results
       :get  results-page}]]]])
```

Something new here is that `:parameters` key.  Tram encourages you not to mix
validation and preparation of a handler with the handler code itself.

Here we are introducing a parameter `:poll-id` for all child routes.  That
parameter shows up in the path, and can be found in your request at
`[:parameters :path :poll-id]`.  That parameter is guaranteed to be an integer
in your handler.  If you pass a non-integer, the route will error.

We also need to define these 2 handler functions with some placeholder data.

```clojure
(defn poll-details [req]
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

## Redirect on missing question

Let's fix that.

To redirect when a user tries to visit a URL for an invalid question, we are
going to use an **interceptor**.

::: tip Definition

**Interceptors** are how Tram adds behavior to routes.  They are Clojure maps
that have a `:name`, and optionally `:enter` and `:leave` functions that take a
context map (with `:request` and `:response`) and return a modified context.
:::

Add a new route, poll-not-found, and add the interceptor to the routes under the
path param.

```clojure
(tr/defroutes routes
  [""
   ["/"
    {:name :route/homepage
     :get  polls-index}]
   ["/polls"
    ["/not-found" ;; [!code ++]
     {:name :route/poll-not-found ;; [!code ++]
      :get  :views/poll-not-found-page}] ;; [!code ++]
    ["/:poll-id"
     {:interceptors [get-poll-interceptor] ;;[!code ++]
      :parameters   {:path [:map [:poll-id :int]]}}
     ...]]])
```
Notice that the not found page uses a keyword and not a handler function, or
view function.  A keyword like `:views/<template>` can be used in place of a
full handler when all you do in a handler is return a 200.  Tram will look it up
in the corresponding views ns.

`get-poll-interceptor` will read the poll from the database, and redirect to the
not found page if it does not exist.

```clojure
(def get-poll-interceptor
  {:name  ::get-poll-interceptor
   :enter (fn [ctx]
            (let [poll-id
                  (get-in ctx [:request :parameters :path :poll-id])]
              (if-let [poll
                       (db/select-one :models/polls :id poll-id)]
                (assoc-in ctx [:request :poll] poll)
                (tr/early-response ctx (tr/full-redirect :route/poll-not-found)))))})
```

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

::: tip

Try to add some choices using `db/insert!`.  That way you can see the choices on
the page.

:::

First we need to template the poll page. We once again use hiccup and create a
simple form.

```clojure
(defn poll-details-page [{:keys [poll]
                          :as   locals}]
  [:<>
   [:form.ml-4 {:hx-post (tr/make-route :route/vote
                                        {:poll-id (:id poll)})}
    [:fieldset.flex.flex-col.gap-4
     [:legend [:h1.text-xl.font-bold (:text poll)]]
     [:ul#errors]
     (for [choice (:choices poll)
           :let   [{:keys [id text]} choice
                   html-id (format "choice-%s" (:id choice))]]
       [:div.flex.gap-2.items-center
        [:input {:type     :radio
                 :required true
                 :class    "radio"
                 :name     :choice
                 :id       html-id
                 :value    id}]
        [:label {:for html-id}
         text]])]
    [:button.btn.btn-primary.mt-4 "Vote"]]])
```

This template accepts the poll, which has choices, iterates over the choices as
radio buttons, and will post that form to the route for casting votes.

Something to notice is the empty `[:ul#errors]`.  That is where we'll inject
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
   :locals {:question (db/hydrate (:question req) :choices)}})
```

Now we need to create the vote route so that we can save the vote.

Add this route under the `:question-id` path

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

First we grab `:choice` from the request body (remember, `:parameters`)
guarantees that it is present and has the right shape.

Then we will use a function from our poll concern namespace (not yet written) to
cast the vote. Functions that modify things or have side effects often end in
`!` to signal that. If we return a value, then the write was successful, and we
can redirect to the results page. If nothing comes back, we did not successfully
cast the vote, adn we need to return an error response. We send hiccup
corresponding to our error `:ul` from earlier, and specify in our header that
nothing is meant to be swapped in normally.

If you had a lot of places that used the combo poll/choice, you could write an
interceptor to handle bad behavior in a custom way.  Then you could use that and
guarantee that the choice was already correct in the handler fn.  I skip that
here since it's not used again right now.

With these routes, we can now vote on polls.  Let's get a results page so we can
see who voted for what.

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
   [:a.mt-4.btn.btn-primary {:href (tr/make-route :route/vote
                                                  {:poll-id (:id poll)})}
    "Vote again?"]])
```

We update the handler

```clojure
(defn results-page [req]
  (let [{:keys [question]} req]
    {:status 200
     :locals {:question (db/hydrate question :choices)}}))
```

And we're done! You can see the results, and jump back to the poll to vote
again. 
