# Global Cache

Global Cache lets test workers share expensive data through a central cache, including across parallel workers and repeated test runs.

## Language

**Global Cache**:
The product as a whole, encompassing the framework-independent cache and its test-runner integrations.
_Avoid_: global-cache, GlobalCache (except in literal package names or code identifiers)

**Core**:
The framework-independent Global Cache foundation. It provides the central cache used directly or through an integration.
_Avoid_: Base, backend

**Integration**:
A test-runner-specific entry point to Global Cache that presents Core through the conventions and lifecycle of that test runner.
_Avoid_: Plugin, adapter

**Playwright integration**:
The Global Cache integration for Playwright users.
_Avoid_: Playwright package
