---
title: Metrics
sidebar_position: 1
description: Collect Crossplane metrics from connected control planes into Hub and query them with PromQL through the hub API.
---

Metrics collects Crossplane metrics from your connected control planes, stamps
them with the identity of the control plane they came from, and stores them in a
Prometheus-compatible backend. You read them back with PromQL through the hub
API, scoped to the control planes you're allowed to see.

<!-- vale Google.WordList = NO -->
The feature serves the `metrics.hub.upbound.io` API group, which provides the
`Query` resource, and the OTLP ingest endpoint the connector pushes to.
<!-- vale Google.WordList = YES -->

:::note
Metrics is an alpha feature. It's disabled by default, and its API may change in
incompatible ways between releases. See the [feature
lifecycle](../../reference/feature-releases.md).
:::

## The pipeline

Metrics spans both charts. The connector collects on the control plane side, and
`hub-core` receives, labels, and stores on the hub side.

| Component | Chart | What it does |
| --- | --- | --- |
| Collector | `hub-connector` | Scrapes Crossplane pods in the control plane, filters to a curated allowlist, and exports OTLP to the hub. |
| Resource state metrics | `hub-connector` | Exposes per-resource condition gauges for the collector to scrape. Optional. |
| Ingest endpoint | `hub-core` | Receives the connector's OTLP push, resolves the caller's identity, and forwards to the gateway. |
| OTEL gateway | `hub-core` | Stamps identity labels, drops high-cardinality attributes, applies a safety-net allowlist, and writes to the backend. |
| Query API | `hub-core` | Runs PromQL range queries against the backend, scoped to the caller's control planes. |

The collector discovers pods carrying the `prometheus.io/scrape: "true"`
annotation in the namespaces you name, and scrapes port `8080` unless the pod
overrides it with `prometheus.io/port`. Nothing leaves the control plane except
metrics matching the allowlist.

### The curated allowlist

Only allowlisted metric names leave a control plane. The connector filters on the
way out, and the gateway filters again on the way in, so a connector can't push
arbitrary series into the backend.

| Metric | Source |
| --- | --- |
| `controller_runtime_reconcile_total` | Crossplane and provider controllers |
| `controller_runtime_reconcile_errors_total` | Crossplane and provider controllers |
| `controller_runtime_reconcile_time_seconds.*` | Crossplane and provider controllers |
| `upjet_resource_external_api_calls_total` | Upjet-based providers |
| `function_run_function_seconds.*` | Composition functions |
| `kube_customresource_.*` | Resource state metrics |

Both sides of the allowlist are Helm values, so you can widen or narrow them. See
[Enable and configure Metrics](configuration.md).

### Identity labels

The gateway stamps three labels on every series, taken from the authenticated
connector rather than from the payload. A connector can't claim to be a different
control plane.

| Label | Value |
| --- | --- |
| `realm` | The realm that owns the control plane. |
| `control_plane_name` | The control plane's name, unique in its realm. |
| `control_plane_id` | `<realm>/<name>`. Globally unique, so queries can't collide across realms. |

The gateway also deletes the per-pod and per-node resource attributes the
Prometheus receiver adds, such as `k8s.pod.name`, `k8s.node.name`, and
`service.instance.id`. Those attributes are high cardinality and carry no
fleet-level signal.

## Resource state metrics

Resource state metrics turns the state of Crossplane resources into gauges.
Where the controller metrics tell you how the reconcilers are behaving, these
tell you what the resources themselves report.

The connector deploys a resource-state-metrics server and a
`ResourceMetricsMonitor` that generates a `resource_condition` family: one series
per resource condition, labeled with `condition_type`, valued `1` when the
condition is `True` and `0` otherwise.

By default the `ResourceMetricsMonitor` watches every API group. Each group
creates informers that consume memory, so on a large control plane scope it to
the groups you care about. See [Enable and configure Metrics](configuration.md).

## Querying

`Query` is a cluster-scoped, create-only resource. You POST a PromQL range query
and the response is the same object with `results` filled in.

```yaml title="query.yaml"
apiVersion: metrics.hub.upbound.io/v1alpha1
kind: Query
query:
  promql: sum by (control_plane_name) (rate(controller_runtime_reconcile_total[5m]))
  start: "2026-07-29T14:00:00Z"
  end: "2026-07-29T15:00:00Z"
  step: 1m
```

```bash
kubectl --context=hub create -f query.yaml -o yaml
```

Set all four fields. `start` and `end` take RFC3339 timestamps, and `step` takes
a Go duration such as `15s`, `1m`, or `5m`.

The response carries `results.series`, one entry per time series, each with its
`labels` and a list of `values` as timestamp and value pairs:

```yaml
results:
  series:
    - labels:
        control_plane_name: prod-us-east
        realm: acme
      values:
        - timestamp: 1785679200
          value: 12.4
        - timestamp: 1785679260
          value: 13.1
```

### Query scoping

Hub scopes every query to the caller's authorized control planes. It injects a
`control_plane_id` matcher into your PromQL before running it, so a query written
without one still only returns your own control planes. A caller who can see
every control plane gets the query unmodified.

A caller with no authorized control planes gets `403`. See the [RBAC
guide](../../howtos/rbac.md) for how realm roles grant access.

## Roadmap

<!-- vale write-good.Passive = NO -->
- Console dashboards over the query API are planned. Today you query through the
  hub API.
- The allowlist is fixed at deploy time through Helm values, and isn't
  configurable per control plane from the hub.
<!-- vale write-good.Passive = YES -->

## See also

- [Enable and configure Metrics](configuration.md)
- [Connect a control plane](../../howtos/connect-control-plane.md)
- [Feature flags](../../reference/feature-flags.md)
- [Feature lifecycle](../../reference/feature-releases.md)
