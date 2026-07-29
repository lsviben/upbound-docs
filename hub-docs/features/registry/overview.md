---
title: Registry
sidebar_position: 1
description: Connect Hub to private or public OCI registries so it can authenticate to them and index the packages your control planes install.
---

Registry connects Hub to your own OCI registries, such as private Artifactory
instances, public registries, or air-gapped mirrors. Hub authenticates to them
and indexes images you declare or observe on connected control planes.

The feature serves the `registry.hub.upbound.io` API group, which provides the
`Connection` resource with its `verify` subresource, and the `Repository`
resource.

:::note
Registry is an alpha feature. It's disabled by default, and its API may change
in incompatible ways between releases. See the [feature
lifecycle](../../reference/feature-releases.md).
:::

## Concepts

A `Connection` and a `Repository` describe how Hub reaches a registry.

| Resource | What it declares |
| --- | --- |
| `Connection` | How Hub authenticates to a registry: a host, an optional path scope, and credentials. |
| `Repository` | What to index: the full OCI path of a repository, and optionally which `Connection` to use for it. |

Both resources belong to a realm. Credentials declared in one realm are never
used to pull for another implicitly.

## How the catalog uses connections

<!-- vale gitlab.SentenceLength = NO -->
When a connected control plane installs a Crossplane package,
Hub records its data in the catalog by pulling
the package's manifest and content layers from the registry.
<!-- vale gitlab.SentenceLength = YES -->

Cataloguing is independent of whether the control plane's own image pull
succeeds. A connected control plane uses its own `packagePullSecrets`, while Hub pulls
with the realm keychain.

Registry and [Catalog](../catalog/overview.md) are separate gates. Registry
supplies the credentials and Catalog consumes them. Turn on Registry when the
packages your fleet runs live somewhere Hub can't reach anonymously.

### The realm keychain

Within a realm, all `Connection` resources form a keychain. When Hub needs to
pull an image, for cataloguing or to verify a `Connection`, it selects the
`Connection` whose `scope` is the longest prefix of the image path. One realm can
hold multiple credentials for the same host, each scoped to a different path.

<!-- vale write-good.Passive = NO -->
A `Repository` can opt out of keychain resolution by pinning a single
`Connection` with `spec.connectionRef`. Pin a connection when policy requires
that a repository's credentials can't be resolved via the keychain.
<!-- vale write-good.Passive = YES -->

## Roadmap
<!-- vale write-good.Passive = NO -->
- `WorkloadIdentity` method for passwordless authentication is reserved in the API
for registries supporting it, and not yet implemented.
- Background scanning of declared repositories, periodically mirroring tags from
the upstream registry into the catalog, is planned.
<!-- vale write-good.Passive = YES -->

## See also

- [Enable and configure Registry](configuration.md)
- [Catalog overview](../catalog/overview.md)
- [Feature flags](../../reference/feature-flags.md)
- [Feature lifecycle](../../reference/feature-releases.md)
