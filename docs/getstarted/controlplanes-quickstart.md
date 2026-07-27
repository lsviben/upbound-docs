---
title: Quickstart
sidebar_position: 2
pagination_prev: null
pagination_next: null
---

<!-- vale gitlab.FutureTense = NO -->
In about 10 minutes, you'll run a control plane, the Hub, and a sample project on
your laptop, deploy a web app, and review its resources in the Upbound Console.
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
* [up CLI][upCli]
* An Upbound account

## Step 1: Run the installation script

The script creates a kind cluster, installs the control plane and Hub
components, and initializes a sample project. It prompts you to log in to
Upbound the first time it runs.

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

## Step 2: Deploy an example resource

```shell
kubectl apply -f my-webapp/examples/webapps/example.yaml
```

## Step 3: See it in the Console

The project runs on the same cluster as the Hub, so the resource appears in the
Console automatically, with no extra connection step. Open the Console and find
your new `webservice` resource.

To watch the Hub reflect configuration changes, scale the replica count up:

```shell
kubectl patch webapp webservice -n default --type=merge -p '{"spec":{"parameters":{"replicas":3}}}'
```

The Console shows the new replica count as the control plane reconciles.

## Step 4: Create and connect a second control plane

A single control plane is where you start. As you scale, the Hub helps you
manage them by aggregating resources across many clusters into one view.

This section spins up a second local
kind cluster, installs a hub-connector in it, and registers it against your
running demo.

If you're ready to build your own platform, skip to the [clean up](#clean-up)
section.

The second cluster doesn't need host port mappings. It communicates back to the Hub
API over the Docker network.

```shell
kind create cluster --name hub-demo-extra
```

## Step 5: Expose the Hub API

In the demo install, `hub-core` and its token-exchange Service are both
ClusterIP, reachable only from inside the demo cluster. Rather than modify those
Services, add two new NodePort Services alongside them. 

In a production
installation, all traffic would route through a proper Gateway. This step is
only required because you're connecting between kind clusters.

```shell
kubectl --context kind-quickstart -n hub apply -f - <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: hub-core-nodeport
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: hub-core
    app.kubernetes.io/instance: hub
  ports:
    - name: http
      port: 8080
      targetPort: http
      nodePort: 30080
---
apiVersion: v1
kind: Service
metadata:
  name: hub-core-token-exchange-nodeport
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: hub-core
    app.kubernetes.io/instance: hub
  ports:
    - name: token-exchange
      port: 8444
      targetPort: token-exchange
      nodePort: 30444
EOF
```

The selector matches the labels the `hub-core` Pods already carry, so these
Services route to the running API without touching the demo's original ClusterIP
Services.

The connector in the second cluster dials `quickstart-control-plane:30080` for the
API and `:30444` for token exchange. Docker's embedded DNS resolves the hostname
to the demo cluster's control-plane container.

## Step 6: Mint a registration token

The Hub issues a per-control-plane bootstrap secret called a registration token.
The connector presents this token when it first contacts the Hub API, so the Hub
knows which control plane the connector represents.

1. Open the Hub UI at `https://hub.127.0.0.1.nip.io:8443/infrastructure/control-planes`
   and sign in as `admin` / `admin` if you aren't already.
2. Create a new ControlPlane in the `default` realm and name it `extra`.
3. Copy the registration token the UI displays. It's shown once.
4. Set the token as a shell variable for the next step:

```shell
export HUB_EXTRA_CTP_TOKEN=<paste-registration-token-here>
```

## Step 7: Install hub-connector in the second cluster
<!-- vale write-good.Passive = NO -->
`hub-connector` is published as its own chart, separate from the umbrella `hub`
chart.
<!-- vale write-good.Passive = YES -->

```shell
kubectl --context kind-hub-demo-extra create namespace hub

kubectl --context kind-hub-demo-extra -n hub create secret generic hub-connector-credentials \
  --from-literal=registrationToken="$HUB_EXTRA_CTP_TOKEN"

helm install hub-connector oci://xpkg.upbound.io/upbound/hub-connector \
  --kube-context kind-hub-demo-extra \
  --version 1.0.0-rc.1 \
  --namespace hub \
  --set connector.hub.url=http://quickstart-control-plane:30080 \
  --set connector.hub.tokenExchangeUrl=http://quickstart-control-plane:30444 \
  --set connector.hub.allowInsecure=true \
  --set connector.credentials.existingSecretRef.name=hub-connector-credentials
```

Wait for the connector to come up:

```shell
kubectl --context kind-hub-demo-extra -n hub wait --for=condition=ready pod --all --timeout=2m
```
Refresh the Hub UI. Two checks confirm the second cluster is online and
reporting:

- The control planes page shows `extra` alongside the demo's `default` with a
  status of `Ready`.
- The resources page, filtered by control plane name `extra`, shows the
  resources installed in the second cluster.

:::tip
If the new control plane never shows up or never reports any resources, inspect
the connector logs:

```shell
kubectl --context kind-hub-demo-extra -n hub logs deployment/hub-connector
```

The most common failure is the connector being unable to reach
`quickstart-control-plane:30080`, usually because the second cluster didn't join
the shared kind Docker network. Run
`docker network connect kind hub-demo-extra-control-plane` and restart the
connector Pod.
:::

## Clean up

Once you're finished with this quickstart, be sure to clean up the kind
resources you created.

```shell
kubectl delete -f my-webapp/examples/webapps/example.yaml
kind delete cluster --name hub-demo-extra
kind delete cluster --name quickstart
```

## Next steps

- [Builders workshop][workshop] for real cloud resources.
- [Hub overview][hub] for the full-fleet story.

[upCli]: /manuals/cli/overview
[hub]: /hub/
[workshop]: /getstarted/builders-workshop/project-foundations
