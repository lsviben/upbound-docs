---
title: Enable and configure Metrics
sidebar_position: 2
description: Turn on the Metrics feature gate, point the OTEL gateway at a Prometheus-compatible backend, and enable collection on a connected control plane.
---

To collect Crossplane metrics from your control planes, you must enable the
`Metrics` feature gate and the components it needs. It's an alpha feature and
disabled by default until you opt in. See the [Metrics overview](overview.md) for
what the feature does.

Metrics needs configuration on both sides of the pipeline:

| Side | Chart | What you turn on |
| --- | --- | --- |
| Hub | `hub-core` | The `Metrics` gate, the OTEL gateway, and the backend it writes to. |
| Control plane | `hub-connector` | The collector, and optionally resource state metrics. |

<!-- vale Google.WordList = NO -->
Enable the hub side first. A connector with its collector on has nowhere to push
until the ingest endpoint exists.
<!-- vale Google.WordList = YES -->

## Prerequisites

Before you enable Metrics, ensure:

<!-- vale write-good.Passive = NO -->
- A running Hub installation. See [Installing Hub](../../howtos/install.md).
- Helm access to the Hub release, so you can run `helm upgrade`. See [the chart
  reference](../../howtos/install.md#the-chart-reference) for what `<chart-ref>`
  stands for.
- The feature flag server is enabled. It's on by default. See [Feature
  flags](../../reference/feature-flags.md).
- A Prometheus-compatible backend the gateway can remote-write to and the API can
  read from, or a Google Managed Prometheus project. Hub doesn't deploy one.
- At least one connected control plane. See [Connect a control
  plane](../../howtos/connect-control-plane.md).
<!-- vale write-good.Passive = YES -->

<!-- vale Google.Headings = NO -->
## Enable Metrics on the hub
<!-- vale Google.Headings = YES -->

1. Add the `Metrics` gate and the gateway configuration to your `values.yaml`.

   ```yaml title="values.yaml"
   hub-core:
     api:
       featureFlags:
         gates:
           Metrics: true
     otelGateway:
       enabled: true
       metrics:
         backend: prometheus
         queryURL: http://prometheus-server.monitoring.svc
         prometheus:
           writeEndpoint: http://prometheus-server.monitoring.svc/api/v1/write
   ```

   `backend` has no default. Set it explicitly to `prometheus` or `gmp`. Only the
   settings for the backend you select apply.

   | Value | What it sets |
   | --- | --- |
   | `otelGateway.enabled` | Deploys the gateway that receives OTLP from connectors. Required when the gate is on. |
   | `otelGateway.metrics.backend` | `prometheus` for remote-write, `gmp` for Google Managed Prometheus. |
   | `otelGateway.metrics.queryURL` | Base URL the query API reads from. Required when the gateway is on. |
   | `otelGateway.metrics.prometheus.writeEndpoint` | Remote-write URL. Required for the `prometheus` backend. |
   | `otelGateway.metrics.prometheus.insecure` | Skips TLS verification on remote-write. Defaults to `true`. |
   | `otelGateway.metrics.gmp.project` | GCP project to write to. Auto-detected from the pod environment when empty. |
   | `otelGateway.metricAllowlist` | The safety-net allowlist the gateway applies. |

   :::warning
   `insecure: true` is the chart default and skips certificate verification on the
   remote-write connection. Set it to `false` for any backend outside the cluster.
   :::

   For the `gmp` backend, the gateway authenticates with Application Default
   Credentials, so its ServiceAccount needs a Google identity holding
   `roles/monitoring.metricWriter`. Wire that up through Workload Identity or a
   mounted key at deploy time.

2. Apply the values with an upgrade.

   ```shell
   helm upgrade hub <chart-ref> \
     --namespace hub \
     --values values.yaml
   ```

   :::warning
   `--values` replaces the release's user-supplied values instead of merging with
   them. When you enable a gate on an existing release, apply your complete values
   file, or add `--reuse-values` to keep the rest of the release's configuration.
   Dropping the values that configure the database leaves `hub-core` unable to
   connect, which surfaces as a failed `hub-core-migrate` pre-upgrade hook rather
   than as a values error.
   :::

3. Confirm the gateway pods reach `Ready`.

   ```shell
   kubectl --namespace hub get pods --selector app.kubernetes.io/component=otel-gateway
   ```

:::warning
Turning the gate on without the gateway fails at startup. `hub-core` requires
both `queryURL` and the gateway URL when you enable `Metrics`, and refuses to
start on the half-configured combination rather than serving an API that returns
nothing.
:::

## Enable collection on a control plane

Turn on the collector in the connector release for each control plane you want
metrics from.

1. Add the collector configuration to the connector's values.

   ```yaml title="connector-values.yaml"
   collector:
     enabled: true
     scrapeInterval: "15s"
     scrapeNamespaces:
       - crossplane-system
   ```

   Set `scrapeNamespaces` to where Crossplane runs: `crossplane-system` for
   upstream Crossplane, `upbound-system` for UXP.

   | Value | What it sets |
   | --- | --- |
   | `collector.enabled` | Deploys the collector and the local metrics-proxy Service. |
   | `collector.scrapeInterval` | How often to scrape. Defaults to `15s`. |
   | `collector.scrapeNamespaces` | Namespaces to discover Crossplane pods in. |
   | `collector.metricAllowlist` | Metric names allowed to leave the control plane. |

2. Optionally add resource state metrics.

   ```yaml title="connector-values.yaml"
   rsm:
     enabled: true
     apiGroups:
       - pkg.crossplane.io
       - s3.aws.upbound.io
   ```

   `rsm.apiGroups` defaults to `["*"]`, which watches every group. Each group
   creates informers that consume memory, so scope it to the provider groups you
   care about on a large control plane. Resource state metrics only render when
   `collector.enabled` is also `true`.

3. Upgrade the connector release.

   ```shell
   helm upgrade hub-connector oci://xpkg.upbound.io/upbound/hub-connector \
     --kube-context "$CONTROL_PLANE_CONTEXT" \
     --namespace upbound-system \
     --reuse-values \
     --values connector-values.yaml
   ```

4. Confirm the collector pods reach `Ready`.

   ```shell
   kubectl --context="$CONTROL_PLANE_CONTEXT" --namespace upbound-system \
     get pods --selector app.kubernetes.io/name=hub-connector
   ```

## Verify

1. Query the API group to confirm it responds. With the gate on, the endpoint
   `/apis/metrics.hub.upbound.io/v1alpha1` should return the following:

   ```json
   {
     "kind": "APIResourceList",
     "apiVersion": "v1",
     "groupVersion": "metrics.hub.upbound.io/v1alpha1",
     "resources": [
       {
         "name": "queries",
         "singularName": "",
         "namespaced": false,
         "kind": "Query",
         "verbs": [
           "create"
         ]
       }
     ]
   }
   ```

2. Run a query for a metric you know the control plane emits. Wait a minute or
   two after you enable the collector, because remote-write isn't immediate.

   ```yaml title="query.yaml"
   apiVersion: metrics.hub.upbound.io/v1alpha1
   kind: Query
   query:
     promql: controller_runtime_reconcile_total
     start: "2026-07-29T14:00:00Z"
     end: "2026-07-29T15:00:00Z"
     step: 1m
   ```

   ```shell
   kubectl --context=hub create -f query.yaml -o yaml
   ```

   The response carries `results.series`, and every series should carry `realm`,
   `control_plane_name`, and `control_plane_id` labels.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `404` on the metrics API group | Enable the `Metrics` gate (`hub-core.api.featureFlags.gates.Metrics=true`). |
| `hub-core` fails to start after you enable the gate | The gate requires both the gateway and a query URL. Set `otelGateway.enabled=true` and `otelGateway.metrics.queryURL`. |
| Helm fails with `otelGateway.metrics.backend is required` | `backend` has no default. Set it to `prometheus` or `gmp`. |
| Queries return `403` | The caller has no authorized control planes. Grant a realm role that covers them. See [RBAC](../../howtos/rbac.md). |
| Queries return no series | Confirm the collector is on for that control plane, and that the metric you asked for is on both allowlists. |
| A metric you expect never arrives | Add its name to `collector.metricAllowlist` on the connector and `otelGateway.metricAllowlist` on the hub. Both filters apply. |
| Only some Crossplane pods report | The collector scrapes pods annotated `prometheus.io/scrape: "true"` on port `8080`. Pods on another port need `prometheus.io/port`. |
| No `kube_customresource_*` series | Resource state metrics needs both `rsm.enabled=true` and `collector.enabled=true`. |
| Gateway logs remote-write TLS errors | Set `otelGateway.metrics.prometheus.insecure=false` and give the gateway a trusted certificate, or correct `writeEndpoint`. |

## See also

- [Metrics overview](overview.md)
- [Connect a control plane](../../howtos/connect-control-plane.md)
- [RBAC and OIDC group mapping](../../howtos/rbac.md)
- [Feature flags](../../reference/feature-flags.md)
