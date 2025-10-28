---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Tram"
  text: "A Clojure web framework"
  tagline: Tool for Rapid Application Modeling
  image:
    src: /logo.png
    alt: Tram Logo
  actions:
    - theme: brand
      text: Overview
      link: /overview
    - theme: brand
      text: Installation
      link: /installation
    - theme: alt
      text: Tutorial App
      link: /tutorial

features:
  - title: Simple and Easy
    details: |
        A curated set of best-in-class tools (Reitit, Integrant, Toucan2, 
        HTMX, Migratus) wired up to work together.

    
  - title: Batteries Included, but Removable 
    details: | 
        Sensible defaults that don't lock you in; everything is just Clojure.
        Tram’s defaults are strong opinions — not locked doors.
    
  
  - title: Data, not Magic
    details: | 
        Routes, systems, and views are data structures, not opaque DSLs.
        It's a programmable environment that embraces the REPL.
   
---
