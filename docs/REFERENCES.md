# Technical references

These references support tooling choices, not claims that this game or its evaluation methods are already validated. Architecture and gameplay requirements are original project decisions.

- JSON Schema Draft 2020-12: https://json-schema.org/draft/2020-12 — basis for the experiment envelope and module-configuration schemas. Consult the matching dialect rather than silently interpreting these as draft-07.
- Ajv JSON Schema documentation: https://ajv.js.org/json-schema.html — Draft 2020-12 requires its corresponding Ajv class; the checker imports `ajv/dist/2020.js`.
- Node.js release information: https://nodejs.org/en/about/previous-releases — choose a supported runtime and record its exact version. The handoff tooling's minimum version is a compatibility requirement, not a statement about the newest release.

The pages above were consulted during handoff preparation on 20 October 2026. The initial renderer candidate is Three.js, but its exact version and browser tooling are intentionally not installed or locked by this documentation-only handoff. Verify the official documentation for the version selected during Stage 1. Do not rely on historical examples as current API guarantees.

Reproducibility, information boundaries, metric definitions, and performance targets in this package are requirements to implement and test, not external certification or promises supplied by these sources.
