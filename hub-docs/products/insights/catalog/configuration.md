---
title: Enable Catalog
sidebar_position: 2
description: Turn on the Catalog and Registry feature gates.
---

To use Catalog, you must enable its feature gate. To configure image registry
connections, you must enable a separate, related feature gate. Both are alpha
features and disabled by default until you opt in. See the Catalog overview
for what Catalog does.

For more information on configuring external registries,
see [External registries.](external-registry.md)

| Gate | Turns on |
| --- | --- |
| `Catalog` | The catalog read API and Crossplane package indexing. |
| `Registry` | The API for connecting private or self-hosted image registries. |