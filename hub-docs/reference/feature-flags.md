---
title: Feature flags
sidebar_position: 2
description: Enable optional Hub features through Helm values.
---

Hub keeps several features behind feature flags. Each flagged feature is at
either the alpha or beta stage of the [feature lifecycle][feature-releases],
which sets its default state:
<!-- vale write-good.Passive = NO -->
- **Alpha** features are disabled by default. You opt in explicitly.
- **Beta** features are enabled by default. The flag stays available so you can
  turn the feature off.

Once a feature reaches general availability its flag is removed and the feature
is always on, so GA features don't appear here. See the [feature
lifecycle][feature-releases] for the stability, support, and
API-compatibility expectations at each stage.

## How feature flags work

Each gate has a built-in default in `hub-core`'s application code, and the
chart only passes your overrides. The values under
`hub-core.api.featureFlags.gates.*` render to a sorted, comma-separated
`FEATURE_GATES` environment variable on the `hub-core` Deployment, such as
`Catalog=true,Registry=true`. When you override nothing, the chart omits the
variable and the built-in defaults stand.

`hub-core` builds its flag definition in memory from those gates and serves it
over [OFREP][ofrep]. No ConfigMap holds the definition, so you toggle features
through Helm values rather than editing flag definitions by hand. Each gate is
named after the capability it controls, as a single PascalCase token such as
`Catalog` or `Registry`.

An unrecognized gate name fails `hub-core` startup rather than being ignored.

`hub-core.api.featureFlags.enabled` controls the flag server itself,
which defaults to `true`. Leave it on. When it's `false`, `hub-core` starts with
no flag client and every gated feature is forced off regardless of the
`gates.*` values.

## Available feature flags

Set a gate with `hub-core.api.featureFlags.gates.<Gate>`; drop the leading
`hub-core.` if you install the `hub-core` subchart on its own. The gate name is
also the name that appears in `FEATURE_GATES` and in the `hub-core` startup
logs. Every gate in this release is alpha, and all but one default to `false`.

<!-- vale Google.WordList = NO -->
| Gate | Default | What it enables |
|------|---------|-----------------|
| `AgentSessions` | `false` | The `agent.hub.upbound.io/v1alpha1` API group, adding session and message endpoints under `/apis/agent.hub.upbound.io/v1alpha1/` for Crossplane troubleshooting. Requires an Anthropic API key (see below). |
| `AggregatedTypes` | `false` | Fleet-wide `typedefinitions` and `crossplanepackages`, and their distribution subresources, under `hub.upbound.io/v1alpha1`. |
| `Catalog` | `false` | The Catalog feature as a unit: the read API (`catalog.hub.upbound.io/v1alpha1`) covering Image list and get, usage, curated, OpenAPI subresources, and ImageSearch, plus the ingest and enrichment pipeline that populates it. |
| `Metrics` | `false` | The metrics ingest endpoint and the `metrics.hub.upbound.io` API group. Requires `hub-core.otelGateway.enabled=true`. |
| `Registry` | `false` | The `registry.hub.upbound.io` API group, providing the `Connection` resource (with its `verify` subresource) and the `Repository` resource. |
| `ResourceFilterExpression` | `true` | CEL-based filtering on resource-list endpoints. Not enforced in this release, see below. |

### Agent sessions require an Anthropic API key

The agent feature calls the Anthropic API and `hub-core` exits at startup when
the gate is on and no key is set. The chart has no dedicated value for the key;
`hub-core` reads `AGENT_SESSIONS_ANTHROPIC_API_KEY` from the environment, so
`api.extraEnv` is how you supply it. See [Enable optional
features](../howtos/enable-features.md#agent-sessions) for the Secret and the
values, and [Agent sessions](../features/agent-sessions/overview.md) for what the
feature does.

### Catalog

The `Catalog` gate turns the feature on as a unit: the read API and the ingest
and enrichment pipeline that populates it move together behind the one gate. See
[Catalog](../features/catalog/overview.md) for what the feature does and [Enable
optional features](../howtos/enable-features.md#catalog-and-registry) for the full setup.

### Metrics

The `Metrics` gate turns on the query API and the endpoint connectors push to.
It also needs the components that carry the pipeline: set
`hub-core.otelGateway.enabled=true` and a backend, or `hub-core` refuses to
start. Enabling the gate collects nothing until you also turn on the collector
in the `hub-connector` chart. See [Metrics](../features/metrics/overview.md) and
[Metrics pipeline](../howtos/metrics.md).

### Registry

The `Registry` gate supplies the credentials Catalog uses to pull from private
or self-hosted registries. See [Registry](../features/registry/overview.md) and
[Enable optional features](../howtos/enable-features.md#catalog-and-registry).

### Resource filter expressions

The `ResourceFilterExpression` gate is the one gate that defaults to `true`, and
`hub-core` doesn't check it. Expression filtering is available on a default
install, and setting the gate to `false` doesn't turn it off. What determines
availability is the API version: `hub.upbound.io/v1beta1` and `v1alpha2` accept
the `filter` parameter, and `v1alpha1` ignores it. See [Resource filter
expressions](../features/resource-filtering/overview.md).

## Enabling a feature gate

Gates go in the same `values.yaml` you installed with, and a `helm upgrade`
applies them. [Enable optional features](../howtos/enable-features.md) carries
that procedure, the values each feature needs alongside its gate, and how to
confirm from the startup logs which gates the running binary picked up.

Disabling a beta feature works the same way in reverse. Set its gate to `false`
to turn off a feature that defaults to on.

## Managing flags outside the chart

For teams that manage flag definitions themselves:

- **Targeting overlay.** Set
  `hub-core.api.featureFlags.targetingOverlay.configMapRef.name` to a ConfigMap
  you maintain, holding a flagd `flags.json` under the key named by
  `targetingOverlay.configMapRef.key` (default `flags.json`). The overlay doesn't
  replace the gates. It layers JSONLogic targeting rules or extra variants on top
  of them, which is how you roll a feature out per organization or per control
  plane rather than fleet-wide. `hub-core` hot-reloads the ConfigMap, so edits
  take effect without restarting the Pods.
- **OFREP endpoint.** The flag server serves OFREP on port `8016` for
  client-side evaluation. It's not exposed publicly by default. To route it
  through the public HTTPRoute, set
  `hub-core.api.featureFlags.httpRoute.enabled=true`, which mounts it at
  `/ofrep`.

<!-- vale write-good.Passive = YES -->

[feature-releases]: /hub/reference/feature-releases
[ofrep]: https://openfeature.dev/specification/appendix-c/
