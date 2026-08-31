---
title: Global Cache Core
sidebar_label: Overview
slug: /
---

:::tip Using Playwright?

Go directly to the [Playwright integration](../playwright/index.md). Most Playwright
users do not need to configure Core themselves.

:::

Global Cache coordinates expensive setup work across parallel test workers. The first worker to
request a key computes its value; concurrent workers wait for that computation and then receive the
same result.

![Test runner workers sharing Global Cache](/img/how-it-works-core.png)

## Packages

Global Cache is organized as a framework-independent Core plus test-runner integrations:

- [**Core**](https://www.npmjs.com/package/@global-cache/core) — the code client and server API.
- [**Playwright**](https://www.npmjs.com/package/@global-cache/playwright) — Playwright integration for easier configuration and sharing data across workers.

## What Core provides

- A central HTTP server shared by workers.
- Compute-once coordination for concurrent requests.
- In-memory values scoped to a test run.
- Filesystem-backed values with a time to live (TTL).
- Stale-value access for safe end-of-run cleanup.
- Typed key/value schemas for TypeScript consumers.

Use Core directly when building another test-runner integration or connecting processes to a shared
cache server. Playwright users can use the integration instead of managing the server and run
boundaries themselves.

## Next steps

- Read [Core concepts](./concepts.md) to understand keys, test runs, and persistence.
- Use the [Core client](./client.md) when building an integration.
- See the [Core API reference](./api.md) for the exported classes and methods.
