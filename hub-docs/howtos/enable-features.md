---
title: Enable optional features
sidebar_position: 5
description: Turn on Hub's optional features from one values file and a single upgrade.
---

Hub keeps several features behind feature gates. Every gate is off by default,
and you turn each one on the same way: add it to your Helm values and upgrade the
release. This page is the single place that procedure lives, along with the extra
configuration each feature needs once its gate is on.

See [Feature flags](../reference/feature-flags.md) for how gates reach the
binary, and [Feature lifecycle](../reference/feature-releases.md) for what alpha
and beta mean for support and API compatibility.

## Prerequisites

- A running Hub installation. See [Installing Hub](install.md).
- Helm access to the Hub release, so you can run `helm upgrade`. See [the chart
  reference](install.md#the-chart-reference) for what `<chart-ref>` stands for.
- The feature flag server enabled. The server is on by default; the gates it
  serves aren't.
- Network egress from the `hub-core` namespace to whatever a feature talks to:
  the registries hosting your packages for Catalog and Registry, the Anthropic
  API for agent sessions.

## The manifest

Everything below goes in the same `values.yaml` you installed with. Enable only
the features you want, and keep the rest of your install's values in the file:

```yaml title="values.yaml" manifest="/manifests/hub/enable-features.yaml"
```

Download it with
[`curl -O https://docs.upbound.io/manifests/hub/enable-features.yaml`](/manifests/hub/enable-features.yaml).

Which gates need more than a boolean:

| Gate | Stage | Also required | Feature |
| --- | --- | --- | --- |
| `AgentSessions` | Alpha | An Anthropic API key, or `hub-core` won't start | [Agent sessions](../features/agent-sessions/overview.md) |
| `AggregatedTypes` | Alpha | Nothing | [Insights](../features/insights/overview.md) |
| `Catalog` | Alpha | Nothing for public registries | [Catalog](../features/catalog/overview.md) |
| `Metrics` | Alpha | `otelGateway.enabled` and a backend, or `hub-core` won't start | [Metrics pipeline](metrics.md) |
| `Registry` | Alpha | `Connection` resources for the registries you pull from | [Registry](../features/registry/overview.md) |
| `ResourceFilterExpression` | Alpha | Nothing, and it defaults to on | [Resource filtering](../features/resource-filtering/overview.md) |

## Apply it

```shell
helm upgrade hub <chart-ref> \
  --namespace hub \
  --values values.yaml
```

:::warning
`--values` replaces the release's user-supplied values instead of merging with
them. Apply your complete values file, or add `--reuse-values` to keep the rest
of the release's configuration. Dropping the values that configure the database
leaves `hub-core` unable to connect, which surfaces as a failed
`hub-core-migrate` pre-upgrade hook rather than as a values error.
:::

To flip a single gate without a values file:

```shell
helm upgrade hub <chart-ref> \
  --namespace hub --reuse-values \
  --set hub-core.api.featureFlags.gates.Catalog=true
```

The upgrade rolls the `hub-core` Pods and the feature becomes active once they're
`Ready`. The startup logs list every gate `hub-core` evaluated, so you can
confirm the running binary picked up the change:

```shell
kubectl --namespace hub logs deployment/hub-core | grep -i feature
```

An unrecognized gate name fails startup rather than being ignored.

## Agent sessions {#agent-sessions}

The feature calls the Anthropic API and `hub-core` exits at startup when the gate
is on and no key is set. Create the Secret before you upgrade:

```shell
kubectl --namespace hub create secret generic hub-agent-anthropic \
  --from-literal=ANTHROPIC_API_KEY='<your-anthropic-api-key>'
```

The chart has no dedicated value for the key, so `api.extraEnv` is how you supply
it, as in [the manifest](#the-manifest) above. The equivalent command-line flag
is `--agent-sessions-anthropic-api-key`.

:::warning
Startup only checks that a key is present, not that it works. An invalid key
starts cleanly and fails at request time instead, as an `error` event on the
message stream.
:::

Organization admins can use `sessions` and `sessions/messages` by default. Other
users have no access until you grant it. See [RBAC](rbac.md).

Confirm the API group responds:

```shell
kubectl --context=hub get --raw /apis/agent.hub.upbound.io/v1alpha1
```

With the gate off, the group is absent from discovery and its endpoints return
`404`.

## Catalog and Registry {#catalog-and-registry}

The `Catalog` gate turns on the feature as a unit: the read API
(`catalog.hub.upbound.io`) and the ingest and enrichment pipeline that populates
it move together.

Public registries need nothing else. For private or self-hosted registries, also
enable `Registry`, which serves the API where you declare the credentials Hub
pulls with, then create a `Connection` per registry. See
[Registry](../features/registry/overview.md) for credential scoping and
verification.

Confirm both API groups respond:

```shell
kubectl --context=hub get --raw /apis/catalog.hub.upbound.io/v1alpha1
kubectl --context=hub get --raw /apis/registry.hub.upbound.io/v1alpha1
```

Catalog serves `images` (with the `curated`, `openapi`, and `usage`
subresources) and `imagesearches`. Registry serves `connections` (with `verify`)
and `repositories`.

## Metrics {#metrics}

Metrics spans both charts and needs a gateway and a storage backend, so its setup
has its own page: [Metrics pipeline](metrics.md). The `Metrics` gate belongs in
the same values file as the gateway configuration.

## Aggregated types {#aggregated-types}

`AggregatedTypes` adds the fleet-wide `typedefinitions` and `crossplanepackages`
resources under `hub.upbound.io/v1alpha1`. The Console's Definitions page reads
`typedefinitions`, so that page stays empty until the gate is on. See
[Insights](../features/insights/overview.md).

## Resource filter expressions {#resource-filter-expressions}

`ResourceFilterExpression` is the one gate that defaults to `true`, and
`hub-core` doesn't check it. What determines availability is the API version:
`hub.upbound.io/v1beta1` and `v1alpha2` accept the `filter` parameter, and
`v1alpha1` ignores it. See [Resource
filtering](../features/resource-filtering/overview.md).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `404` on a feature's API group | Its gate is off. Check the `hub-core` startup logs for the gate's resolved value. |
| `hub-core` crash-loops right after you enable `AgentSessions` | The Secret is missing or the key name doesn't match the `secretKeyRef` in your values. The log line names the flag: `--agent-sessions-anthropic-api-key … is required when the AgentSessions feature flag is on`. |
| `hub-core` fails to start after you enable `Metrics` | The gate needs `otelGateway.enabled=true` and a query URL. See [Metrics pipeline](metrics.md). |
| `hub-core` fails to start with an unknown-gate error | Gate names are single PascalCase tokens and are case-sensitive. Check the spelling against [Feature flags](../reference/feature-flags.md). |
| A gate you set stays off | `hub-core.api.featureFlags.enabled` must be `true`. With the flag server off, every gated feature is forced off regardless of `gates.*`. |
| The upgrade fails on the `hub-core-migrate` hook | `--values` replaced your database values. Re-apply your complete values file, or use `--reuse-values`. |
| Catalog enrichment fails with an auth error | The `Connection` `scope` must be a prefix of the image path, and the `Connection` must be in the same realm as the control plane. |
| A `Connection` verifies but is rejected at create | `authMethod: Static` requires `spec.static` with a username and a secret. `Anonymous` must omit `spec.static`. |

## See also

- [Feature flags](../reference/feature-flags.md)
- [Feature lifecycle](../reference/feature-releases.md)
- [Metrics pipeline](metrics.md)
- [RBAC and OIDC group mapping](rbac.md)
