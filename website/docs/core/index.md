---
title: Global Cache Core
sidebar_label: Overview
slug: /
---

Global Cache coordinates expensive setup work across parallel test workers. The first worker to
request a key computes its value; concurrent workers wait for that computation and then receive the
same result.

![Global Cache architecture](/img/architecture.png)

## Packages

Global Cache is organized as a framework-independent Core plus test-runner integrations:

- **Core** — the HTTP server, storage, and client API in
  [`@global-cache/core`](https://www.npmjs.com/package/@global-cache/core).
- **Playwright** — the supported integration in
  [`@global-cache/playwright`](https://www.npmjs.com/package/@global-cache/playwright). It starts
  Core automatically and connects cache cleanup to Playwright's run lifecycle.

:::tip Using Playwright?

Go directly to the [Playwright installation guide](../playwright/installation.md). Most Playwright
users do not need to configure Core themselves.

:::

## What Core provides

- A central HTTP server shared by workers.
- Compute-once coordination for concurrent requests.
- In-memory values scoped to a test run.
- Filesystem-backed values with a time to live (TTL).
- Stale-value access for safe end-of-run cleanup.
- Typed key/value schemas for TypeScript consumers.

Core can be used directly to build another test-runner integration. Direct consumers are responsible
for starting the server and defining when a test run ends; integrations normally own that lifecycle.

## Next steps

- Read [Core concepts](./concepts.md) to understand keys, test runs, and persistence.
- Use the [Core client](./client.md) when building an integration.
- See the [Core API reference](./api.md) for the exported classes and methods.
