---
title: Hub
slug: /
sidebar_position: 0
description: Hub is the central cluster in an Upbound Platform deployment, where the platform's central components install.
---

Hub is the central cluster in an Upbound Platform deployment. Hub is where you
install the platform components, and it manages the `hub-core` server, the
indexer, search, and the Console. Connect your Space, UXP instance, or generic
Kubernetes clusters to push their state to Hub, then query your whole fleet.

## Operating a fleet of control planes

Each Crossplane control plane answers questions only about itself. Comparing
provider versions, finding recent Composition changes, or checking claim health
across a fleet means querying one `kubectl` context at a time.
Most teams cover the gap with scripts and dashboards they maintain themselves.

A `hub-connector` running inside each control plane streams resource state into
a central Postgres-backed store. Hub re-exposes that aggregated view through a
Kubernetes-style API and a web UI.

## What you can do with Hub

* **Manage a fleet of Crossplane control planes.** Register new control planes
  from the Hub UI, deregister ones you no longer want to see, and keep a single
  inventory across teams, regions, and clouds.

* **Query resources across all connected control planes from one screen.** The
  Console resource browser shows everything your connectors report, with sort,
  filter, and search spanning all clusters at once.

* **Roll resources up into aggregate statistics.** Group them by health, by
  labels and annotations, or by creation and deletion timestamps. Ask "how many
  claims are Ready across the fleet right now?" without writing a query per
  cluster.

* **Track those statistics over time.** Hub keeps time-series state for the same
  aggregations, so resource counts, health, and turnover show up as trends
  instead of point-in-time snapshots.

* **See every type defined across the fleet, and where it varies.** Hub indexes
  the CRDs and XRDs installed in every control plane, so you can compare the
  same type across clusters and spot the one running an older schema or a
  locally patched spec.

* **Track installed Crossplane packages across the fleet.** Hub lists every
  Provider, Configuration, and Function alongside the version each control plane
  runs, so you can spot version drift.
