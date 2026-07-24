---
title: External registries
sidebar_position: 3
description: Connect Hub to private or public OCI registries so the catalog can authenticate and enrich the packages your control planes install.
---

Connect Hub to your own OCI registries, such as private Artifactory
instances, public registries, or air-gapped mirrors. This allows Hub to
authenticate to them and index images you declare or observe on connected
control planes into the Catalog.

:::note
External registry connection is an alpha feature. It's
disabled by default, and the APIs may change in incompatible ways between
releases. See the [feature lifecycle](../../reference/feature-releases.md).
:::

## Concepts

Two resources describe how Hub reaches a registry.

| Resource | What it declares |
| --- | --- |
| `Connection` | How Hub authenticates to a registry: a host, an optional path scope, and credentials. |
| `Repository` | What to index: the full OCI path of a repository, and optionally which `Connection` to use for it. |

Both resources belong to a realm. For example, credentials
declared in one realm are never used to pull for another implicitly.

## How the catalog uses connections

When a connected control plane installs a Crossplane package,
Hub records its data in the catalog by pulling
the package's manifest and content layers from the registry.

Cataloguing is independent of whether the control plane's own image pull
succeeds. A connected control plane uses its own `packagePullSecrets`, while Hub pulls
with the realm keychain.

### The realm keychain

Within a realm, all `Connection` resources form a keychain. When Hub needs to
pull an image, for cataloguing or to verify a `Connection`, it selects the
`Connection` whose `scope` is the longest prefix of the image path. One realm can
hold multiple credentials for the same host, each scoped to a different path.

A `Repository` can opt out of keychain resolution by pinning a single
`Connection` with `spec.connectionRef`. Pin a connection when policy requires
that a repository's credentials can't be resolved via the keychain.

## Enable the feature

The registry API requires the `Registry` feature gate for the
`Connection` and `Repository` resources. See [Enable and configure
Catalog](./configuration.md), which covers the Helm values and how to verify
them. For the full gate catalog, see [Feature
flags](../../reference/feature-flags.md).

Confirm the registry group is available via `/apis/registry.hub.upbound.io/v1alpha1`:

```json
{
  "kind": "APIResourceList",
  "apiVersion": "v1",
  "groupVersion": "registry.hub.upbound.io/v1alpha1",
  "resources": [
    {
      "name": "connections",
      "singularName": "",
      "namespaced": true,
      "kind": "Connection",
      "verbs": [
        "create",
        "delete",
        "get",
        "list",
        "update"
      ]
    },
    {
      "name": "connections/verify",
      "singularName": "",
      "namespaced": true,
      "kind": "ConnectionVerification",
      "verbs": [
        "create"
      ]
    },
    {
      "name": "repositories",
      "singularName": "",
      "namespaced": true,
      "kind": "Repository",
      "verbs": [
        "create",
        "delete",
        "get",
        "list",
        "update"
      ]
    }
  ]
}
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `404` on the registry API group | Enable the `Registry` gate (`hub-core.api.featureFlags.gates.Registry=true`). |
| `401` on Hub API calls | The bearer token expired. Obtain a fresh one. |
| Verify succeeds but enrichment fails with an auth error | The `Connection` `scope` must be a prefix of the image path, and the `Connection` must be in the same realm as the control plane. |
| Verify tier-2 returns `forbidden` | The credential authenticates but isn't authorized to pull that image. Grant read on the repository. |
| `connection refused` from Hub | The registry host must be reachable from Hub's network. |
| Static auth rejected at create | `authMethod: Static` requires `spec.static` with a username and a secret. `Anonymous` must omit `spec.static`. |

## Roadmap

- `WorkloadIdentity` method for passwordless authentication is reserved in the API
for registries supporting it, and not yet implemented.
- Background scanning of declared repositories, periodically mirroring tags from
the upstream registry into the catalog, is planned.

## See also

- [Catalog overview](overview.md)
- [Enable and configure Catalog](configuration.md)
- [Catalog API overview](reference.md)
- [Feature flags](../../reference/feature-flags.md)
