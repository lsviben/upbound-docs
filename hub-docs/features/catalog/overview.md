---
title: Catalog
sidebar_position: 1
description: Index and search the package images running across your fleet through Hub's Catalog API.
---

Catalog is an index of the package images running across your
connected control planes and makes them queryable through a dedicated API.

<!-- vale gitlab.SentenceLength = NO -->
<!-- vale write-good.Passive = NO -->
Instead of inspecting each control plane on its own, you query one Catalog API to
look up images, see how the resources they declare are used, and search across
everything Hub has indexed.
<!-- vale write-good.Passive = YES -->
<!-- vale gitlab.SentenceLength = YES -->

In comparison, the Resource API returns live resources in your fleet (pods,
managed resources) while the Catalog indexes the package images that declare
those types.

![The Catalog page in the Console](/img/hub/catalog/catalog-list.png)

:::note
Catalog is an alpha feature. It's disabled by default, and its API may change in
incompatible ways between releases. See the [feature
lifecycle](../../reference/feature-releases.md) for what the alpha stage
guarantees, and avoid relying on Catalog for production workloads.
:::

<!-- vale Google.Headings = NO -->
## What Catalog does
<!-- vale Google.Headings = YES -->

The Catalog API serves package data through two resources:

- `Image`. Lists and gets the package images Hub has indexed. `Image` exposes two
  subresources:
  - `usage`. The image's footprint across your fleet: which control planes run
    it and how many resources of its types they have.
  - `openapi`. The OpenAPI schemas for the resource types the package declares,
    so you can inspect an API without installing the package.
- `ImageSearch`. Searches across the indexed images and their descriptions.

All catalog image data is visible to the organization but users only see the
correlated resources and control planes for realms they have access to.

<!-- vale gitlab.HeadingContent = NO -->
## Use cases
<!-- vale gitlab.HeadingContent = YES -->

- Inventory package images running across every connected control plane, from
  one API.
- Find where a specific image or its resources run through the `usage` subresource.
- Search the indexed images with `ImageSearch` instead of querying each control
  plane.

## Related resources

To start using Catalog, see:

**How-to guides**

- [Browsing the Catalog](console.md)
- [Enable and configure Catalog](configuration.md)

**Reference**

- [Feature flags](../../reference/feature-flags.md)
- [Feature lifecycle](../../reference/feature-releases.md)
