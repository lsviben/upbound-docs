---
title: Enable and configure agent sessions
sidebar_position: 2
description: Turn on the AgentSessions feature gate, supply an Anthropic API key, and verify the API group responds.
---

To use agent sessions, you must enable its feature gate and give `hub-core` an
Anthropic API key. It's an alpha feature and disabled by default until you opt
in. See the [Agent sessions overview](overview.md) for what the feature does.

| Gate | Turns on |
| --- | --- |
| `AgentSessions` | The `agent.hub.upbound.io/v1alpha1` API group and its session and message endpoints. |

## Prerequisites

Before you enable agent sessions, ensure:
<!-- vale write-good.Passive = NO -->
- A running Hub installation. See [Installing Hub](../../howtos/install.md).
- Helm access to the Hub release, so you can run `helm upgrade`. See [the
  chart reference](../../howtos/install.md#the-chart-reference) for what
  `<chart-ref>` stands for.
- The feature flag server is enabled. It's on by default. See [Feature
  flags](../../reference/feature-flags.md).
- An Anthropic API key.
- Network egress from the `hub-core` namespace to the Anthropic API.
<!-- vale write-good.Passive = YES -->

<!-- vale Google.Headings = NO -->
## Enable agent sessions
<!-- vale Google.Headings = YES -->

1. Create a Secret holding your Anthropic API key.

   ```shell
   kubectl -n hub create secret generic hub-agent-anthropic \
     --from-literal=ANTHROPIC_API_KEY='<your-anthropic-api-key>'
   ```

2. Add the `AgentSessions` gate to your `values.yaml`, and inject the key as an
   environment variable.

   ```yaml
   hub-core:
     api:
       featureFlags:
         gates:
           AgentSessions: true
       extraEnv:
         - name: AGENT_SESSIONS_ANTHROPIC_API_KEY
           valueFrom:
             secretKeyRef:
               name: hub-agent-anthropic
               key: ANTHROPIC_API_KEY
   ```

   Set the gate to `false` to disable agent sessions.

   :::note
   The chart has no dedicated value for the API key. `hub-core` reads it from
   the `AGENT_SESSIONS_ANTHROPIC_API_KEY` environment variable, so
   `hub-core.api.extraEnv` is how you supply it. The command line
   flag is `--agent-sessions-anthropic-api-key`.
   :::

3. Apply the values with an upgrade.

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

   The upgrade rolls the `hub-core` Pods. The feature becomes active once they
   are `Ready`.

:::warning
Unlike the other gates, `AgentSessions` has a hard dependency. `hub-core` exits
at startup when the gate is on and the key is empty, with the message
`--agent-sessions-anthropic-api-key (AGENT_SESSIONS_ANTHROPIC_API_KEY) is
required when the AgentSessions feature flag is on`. If the Pods crash-loop
after you enable the feature, confirm the Secret exists in the release namespace
and that the key name matches the `secretKeyRef` in your values.

Startup only checks that a key is present, not that it works. An invalid key
starts cleanly and fails at request time instead, as an `error` event on the
message stream.
:::

## Grant access

Organization admins have `session` and `sessions/messages` resources access by
default. Other users have no access to the feature.
See [Access and authorization](../../howtos/rbac.md).

## Verify

Query the API group to confirm it responds. With the gate on, the endpoint
returns the group's resource list:

```shell
kubectl --context=hub get --raw /apis/agent.hub.upbound.io/v1alpha1
```

```json
{
  "kind": "APIResourceList",
  "apiVersion": "v1",
  "groupVersion": "agent.hub.upbound.io/v1alpha1",
  "resources": [
    {
      "name": "sessions",
      "singularName": "",
      "namespaced": false,
      "kind": "Session",
      "verbs": [
        "create",
        "delete",
        "get",
        "list",
        "update"
      ]
    },
    {
      "name": "sessions/messages",
      "singularName": "",
      "namespaced": false,
      "kind": "Session",
      "verbs": [
        "create"
      ]
    }
  ]
}
```

With the gate off, the group is absent from discovery entirely and these
endpoints return `404`.

## See also

- [Agent sessions overview](overview.md)
- [Start a troubleshooting session](troubleshooting-session.md)
- [Feature flags](../../reference/feature-flags.md)
