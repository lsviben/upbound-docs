---
title: Quickstart
sidebar_position: 2
pagination_prev: null
pagination_next: null
---

<!-- vale gitlab.FutureTense = NO -->
In about 10 minutes, you'll run a control plane and deploy the hub API and review its resources in the Upbound Console.
<!-- vale gitlab.FutureTense = YES -->

## Control planes and Upbound

A Kubernetes control plane is the central management layer for your cluster. It
exposes the Kubernetes API, stores cluster data, schedules pods, and runs the
control loops that keep everything in sync.

Crossplane applies that idea to resources outside the cluster: databases, IAM
policies, compute, and anything else with an API. You manage each one with a
_provider_, a package that lets Crossplane provision resources on an external
service. Crossplane doesn't just create infrastructure, it reconciles it. If
someone edits a security group in a cloud console, Crossplane returns it to your
desired state, the same resilience Kubernetes gives your workloads.

Upbound Crossplane (UXP) adds operational features Crossplane lacks out of the
box: a secrets proxy, backup and restore, and control plane insights. Spaces go
further, hosting many isolated control planes on shared infrastructure instead of
a new cluster for each one.

## Prerequisites:

Before you begin, make sure you have:

* `kind`
* `kubectl`
* `helm`
* An Upbound account

## Run the installation script

The script creates a kind cluster, installs the control plane and Hub
components. 

<!-- vale Google.Units = NO -->
<!-- vale Google.Ordinal = NO -->
:::important
The hub installation in this quickstart is free to try from July
31st, 2026 to October 29th, 2026.
:::
<!-- vale Google.Units = YES -->
<!-- vale Google.Ordinal = YES -->

<details>

    <summary> Quickstart install script </summary>
    ```shell title="quickstart.sh" manifest="/manifests/getstarted/quickstart.sh"
    ```
</details>

Download and run it:

```shell
curl -fsSL "https://docs.upbound.io/manifests/getstarted/quickstart.sh" -o quickstart.sh
bash quickstart.sh
```

The script keeps a Console port-forward running in your terminal. Leave it
running and open a new terminal for the following steps.

## Check out the Console

The hub resources appear in the
Console automatically.


## Clean up

Once you're finished with this quickstart, be sure to clean up the kind
resources you created.

```shell
kind delete cluster --name hub-quickstart
```

## Next steps

- [Builders workshop][workshop] for real cloud resources.
- [Hub overview][hub] for the full-fleet story.

[upCli]: /manuals/cli/overview
[hub]: /hub/
[workshop]: /getstarted/builders-workshop/project-foundations
