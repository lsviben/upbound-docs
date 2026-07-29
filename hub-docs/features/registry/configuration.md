---
title: Enable and configure Registry
sidebar_position: 2
description: Turn on the Registry feature gate through Helm values and verify the API group responds.
---

To connect Hub to private or self-hosted image registries, you must enable the
`Registry` feature gate. It's an alpha feature and disabled by default until you
opt in. See the [Registry overview](overview.md) for what the feature does.

| Gate | Turns on |
| --- | --- |
| `Registry` | The API for connecting private or self-hosted image registries. |
| `Catalog` | The catalog read API and Crossplane package indexing. |

Registry supplies credentials to the catalog, so enable both gates to index
packages from a registry Hub can't reach anonymously. See [Enable and configure
Catalog](../catalog/configuration.md).

## Prerequisites

Before you enable Registry, ensure:
<!-- vale write-good.Passive = NO -->
- A running Hub installation. See [Installing Hub](../../howtos/install.md).
- Helm access to the Hub release, so you can run `helm upgrade`. See [the
  chart reference](../../howtos/install.md#the-chart-reference) for what
  `<chart-ref>` stands for.
- The feature flag server is enabled. It's on by default. See [Feature
  flags](../../reference/feature-flags.md).
- Network egress from the `hub-core` namespace to the registries that host your
  package images.
<!-- vale write-good.Passive = YES -->

<!-- vale Google.Headings = NO -->
## Enable Registry
<!-- vale Google.Headings = YES -->

1. Add the `Registry` gate to your `values.yaml`.

   ```yaml
   hub-core:
     api:
       featureFlags:
         gates:
           Registry: true
   ```

   Set it to `false` to disable Registry.

2. Apply the values with an upgrade.

   ```shell
   helm upgrade hub <chart-ref> \
     --namespace hub \
     --values values.yaml
   ```

   :::warning
   `--values` replaces the release's user-supplied values instead of merging
   with them. When you enable a gate on an existing release,
   apply your complete values file, or add `--reuse-values` to keep the rest of
   the release's configuration. Dropping the values that configure the database
   leaves `hub-core` unable to connect, which surfaces as a failed
   `hub-core-migrate` pre-upgrade hook rather than as a values error.
   :::

   Or set the gate inline. Pass `--reuse-values` so the upgrade keeps the rest
   of your release's configuration and changes only this gate:

   ```shell
   helm upgrade hub <chart-ref> \
     --namespace hub --reuse-values \
     --set hub-core.api.featureFlags.gates.Registry=true
   ```

With the gate on, supply credentials as `Connection` resources in the
`registry.hub.upbound.io` API group.

## Verify

Query the API group to confirm it responds. With the gate on, the endpoint
`/apis/registry.hub.upbound.io/v1alpha1` should return the following:

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
| `401` on Hub API calls | The bearer token expired. Create a fresh one. |
| Verify succeeds but enrichment fails with an auth error | The `Connection` `scope` must be a prefix of the image path, and the `Connection` must be in the same realm as the control plane. |
| Verify tier-2 returns `forbidden` | The credential authenticates but isn't authorized to pull that image. Grant read on the repository. |
| `connection refused` from Hub | The registry host must be reachable from Hub's network. |
| Static auth rejected at create | `authMethod: Static` requires `spec.static` with a username and a secret. `Anonymous` must omit `spec.static`. |

## See also

- [Registry overview](overview.md)
- [Enable and configure Catalog](../catalog/configuration.md)
- [Feature flags](../../reference/feature-flags.md)
