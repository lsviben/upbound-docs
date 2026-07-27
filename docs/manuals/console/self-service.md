---
title: Crossplane WebUI
sidebar_position: 2
description: The Crossplane WebUI
---

The Crossplane Web UI delivers a local, read-only dashboard for inspecting and
understanding your UXP-based control plane behavior directly from within your
cluster.

This dashboard provides visibility into key Crossplane resources, pipelines, and
controller behavior. This visibility helps developers and platform operators
reason about control plane activity without requiring access to cloud-hosted
systems.

:::important
This local Web UI runs inside the same cluster as your UXP installation.
For multi-cluster or enterprise-level management, see the [Upbound
Console][console].
:::

## Key features

- Local, cluster-scoped Web UI that maps 1:1 with a UXP instance
- Introspects Crossplane v2 control planes and AI-powered pipelines
- Shows real-time structure of Operations, Agents, and Function Pipelines
- Works with up project run and up project test workflows
- Displays composed resources, function server packages, and more

## Installation

The Crossplane WebUI comes pre-installed when you install your UXP 2.0 instance using a helm chart.

## Version compatibility

Each Web UI version explicitly ties to a corresponding UXP version.
To ensure feature parity across UXP and the dashboard `upbound/crossplane-web-ui:v1.0.x` works with `upbound/crossplane:v1.0.x`.

## CLI integration

You can launch or manage the Web UI directly from the Upbound CLI:

```shell
up uxp web-ui open
```

To stop the dashboard:

```shell
up uxp web-ui disable
```

Re-enable the dashboard:

```shell
up uxp web-ui enable
```

When using up project run or up project test (for local ephemeral development
clusters), the Web UI automatically configures into the local cluster.

## Dashboard views

The Crossplane Web UI provides a read-only visualization layer like the
Control Plane Explorer in the Upbound Cloud Console, with enhancements for XPv2:

You can:
- View installed controller packages and associated CRDs
- See all resources Crossplane composes, including those with OwnerRef metadata
- Visualize Operations and inspect function pipelines: Understand how functions interact with specific XRs (Composite Resources) and MRs (Managed Resources)

The Crossplane WebUI scopes to UXP clusters only. It doesn't support:
- Spaces
- Teams or Groups
- Authentication or account-based views

[console]: /manuals/console/upbound-console/
